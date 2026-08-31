import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2, BookOpen, PlayCircle, Loader2, FileText } from 'lucide-react';

interface Course {
  id: string;
  title: string;
  description: string | null;
  subject_id: string | null;
  class_id: string | null;
  term: string | null;
  academic_year: string;
  is_published: boolean;
}

interface Lesson {
  id: string;
  course_id: string;
  title: string;
  content: string | null;
  video_url: string | null;
  attachment_url: string | null;
  sort_order: number;
}

const emptyCourse = {
  title: '',
  description: '',
  subject_id: '',
  class_id: '',
  term: 'term1',
  academic_year: String(new Date().getFullYear()),
  is_published: true,
};

export default function Courses() {
  const { role, user } = useAuth();
  const { toast } = useToast();
  const isStaff = role === 'admin' || role === 'teacher';

  const [courses, setCourses] = useState<Course[]>([]);
  const [subjects, setSubjects] = useState<{ id: string; name: string }[]>([]);
  const [classes, setClasses] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyCourse);

  const [lessonCourse, setLessonCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [lessonForm, setLessonForm] = useState({ title: '', content: '', video_url: '' });

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    const [c, s, cl] = await Promise.all([
      supabase.from('courses').select('*').order('created_at', { ascending: false }),
      supabase.from('subjects').select('id, name').order('name'),
      supabase.from('classes').select('id, name').order('name'),
    ]);
    setCourses((c.data as Course[]) || []);
    setSubjects(s.data || []);
    setClasses(cl.data || []);
    setLoading(false);
  };

  const openNew = () => {
    setEditingId(null);
    setForm(emptyCourse);
    setDialogOpen(true);
  };

  const openEdit = (course: Course) => {
    setEditingId(course.id);
    setForm({
      title: course.title,
      description: course.description || '',
      subject_id: course.subject_id || '',
      class_id: course.class_id || '',
      term: course.term || 'term1',
      academic_year: course.academic_year,
      is_published: course.is_published,
    });
    setDialogOpen(true);
  };

  const saveCourse = async () => {
    if (!form.title.trim()) {
      toast({ title: 'Title is required', variant: 'destructive' });
      return;
    }
    const payload = {
      title: form.title.trim().slice(0, 150),
      description: form.description.trim().slice(0, 2000) || null,
      subject_id: form.subject_id || null,
      class_id: form.class_id || null,
      term: form.term as 'term1' | 'term2' | 'term3',
      academic_year: form.academic_year,
      is_published: form.is_published,
      teacher_id: user!.id,
    };
    const { error } = editingId
      ? await supabase.from('courses').update(payload).eq('id', editingId)
      : await supabase.from('courses').insert(payload);
    if (error) {
      toast({ title: 'Could not save course', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: editingId ? 'Course updated' : 'Course created' });
    setDialogOpen(false);
    fetchAll();
  };

  const deleteCourse = async (id: string) => {
    const { error } = await supabase.from('courses').delete().eq('id', id);
    if (error) {
      toast({ title: 'Could not delete course', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'Course deleted' });
    fetchAll();
  };

  const openLessons = async (course: Course) => {
    setLessonCourse(course);
    setLessonForm({ title: '', content: '', video_url: '' });
    const { data } = await supabase
      .from('lessons')
      .select('*')
      .eq('course_id', course.id)
      .order('sort_order');
    setLessons((data as Lesson[]) || []);
  };

  const addLesson = async () => {
    if (!lessonCourse || !lessonForm.title.trim()) return;
    const { error } = await supabase.from('lessons').insert({
      course_id: lessonCourse.id,
      title: lessonForm.title.trim().slice(0, 150),
      content: lessonForm.content.trim().slice(0, 5000) || null,
      video_url: lessonForm.video_url.trim().slice(0, 500) || null,
      sort_order: lessons.length + 1,
    });
    if (error) {
      toast({ title: 'Could not add lesson', description: error.message, variant: 'destructive' });
      return;
    }
    setLessonForm({ title: '', content: '', video_url: '' });
    openLessons(lessonCourse);
  };

  const deleteLesson = async (id: string) => {
    await supabase.from('lessons').delete().eq('id', id);
    if (lessonCourse) openLessons(lessonCourse);
  };

  const subjectName = (id: string | null) => subjects.find((s) => s.id === id)?.name;
  const className = (id: string | null) => classes.find((c) => c.id === id)?.name;

  return (
    <DashboardLayout>
      <PageHeader
        eyebrow="E-learning"
        title="Courses"
        description="Online courses with lessons, videos and reading content for each subject and class."
        actions={
          isStaff ? (
            <Button onClick={openNew} className="gap-2">
              <Plus className="h-4 w-4" /> New Course
            </Button>
          ) : undefined
        }
      />

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : courses.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-14 text-center">
            <BookOpen className="mb-3 h-10 w-10 text-muted-foreground" />
            <p className="font-medium text-foreground">No courses yet</p>
            <p className="text-sm text-muted-foreground">
              {isStaff ? 'Create your first course to start publishing lessons.' : 'Courses will appear here once published.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {courses.map((course) => (
            <Card key={course.id} className="flex flex-col rounded-2xl">
              <CardContent className="flex flex-1 flex-col gap-3 p-5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/15 text-secondary">
                    <BookOpen className="h-5 w-5" />
                  </div>
                  <Badge variant={course.is_published ? 'default' : 'secondary'}>
                    {course.is_published ? 'Published' : 'Draft'}
                  </Badge>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{course.title}</h3>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                    {course.description || 'No description provided.'}
                  </p>
                </div>
                <div className="flex flex-wrap gap-1.5 text-[11px] text-muted-foreground">
                  {subjectName(course.subject_id) && (
                    <span className="rounded-full bg-muted px-2 py-0.5">{subjectName(course.subject_id)}</span>
                  )}
                  {className(course.class_id) && (
                    <span className="rounded-full bg-muted px-2 py-0.5">{className(course.class_id)}</span>
                  )}
                  <span className="rounded-full bg-muted px-2 py-0.5">
                    {course.term?.replace('term', 'Term ') || '—'} · {course.academic_year}
                  </span>
                </div>
                <div className="mt-auto flex items-center gap-2 pt-2">
                  <Button variant="outline" size="sm" className="gap-1.5" onClick={() => openLessons(course)}>
                    <PlayCircle className="h-4 w-4" /> Lessons
                  </Button>
                  {isStaff && (
                    <>
                      <Button variant="ghost" size="icon" onClick={() => openEdit(course)} aria-label="Edit course">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteCourse(course.id)}
                        aria-label="Delete course"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Course dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Course' : 'New Course'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Title</Label>
              <Input
                value={form.title}
                maxLength={150}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Introduction to Algebra"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={form.description}
                maxLength={2000}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="What learners will cover in this course"
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label>Subject</Label>
                <Select value={form.subject_id} onValueChange={(v) => setForm({ ...form, subject_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Select subject" /></SelectTrigger>
                  <SelectContent>
                    {subjects.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Class</Label>
                <Select value={form.class_id} onValueChange={(v) => setForm({ ...form, class_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                  <SelectContent>
                    {classes.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Term</Label>
                <Select value={form.term} onValueChange={(v) => setForm({ ...form, term: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="term1">Term 1</SelectItem>
                    <SelectItem value="term2">Term 2</SelectItem>
                    <SelectItem value="term3">Term 3</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Academic Year</Label>
                <Input
                  value={form.academic_year}
                  maxLength={9}
                  onChange={(e) => setForm({ ...form, academic_year: e.target.value })}
                />
              </div>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-border p-3">
              <div>
                <p className="text-sm font-medium text-foreground">Published</p>
                <p className="text-xs text-muted-foreground">Visible to students and parents</p>
              </div>
              <Switch
                checked={form.is_published}
                onCheckedChange={(v) => setForm({ ...form, is_published: v })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={saveCourse}>{editingId ? 'Save Changes' : 'Create Course'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Lessons dialog */}
      <Dialog open={!!lessonCourse} onOpenChange={(o) => !o && setLessonCourse(null)}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{lessonCourse?.title} — Lessons</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            {lessons.length === 0 && (
              <p className="text-sm text-muted-foreground">No lessons added yet.</p>
            )}
            {lessons.map((lesson, i) => (
              <div key={lesson.id} className="rounded-xl border border-border p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground">
                      {i + 1}. {lesson.title}
                    </p>
                    {lesson.content && (
                      <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">{lesson.content}</p>
                    )}
                    {lesson.video_url && (
                      <a
                        href={lesson.video_url}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2 inline-flex items-center gap-1.5 text-sm text-secondary underline"
                      >
                        <PlayCircle className="h-4 w-4" /> Watch lesson video
                      </a>
                    )}
                  </div>
                  {isStaff && (
                    <Button variant="ghost" size="icon" onClick={() => deleteLesson(lesson.id)} aria-label="Delete lesson">
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {isStaff && (
            <div className="space-y-3 rounded-xl border border-dashed border-border p-3">
              <p className="flex items-center gap-2 text-sm font-medium text-foreground">
                <FileText className="h-4 w-4" /> Add a lesson
              </p>
              <Input
                placeholder="Lesson title"
                maxLength={150}
                value={lessonForm.title}
                onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })}
              />
              <Textarea
                placeholder="Lesson content / notes"
                maxLength={5000}
                value={lessonForm.content}
                onChange={(e) => setLessonForm({ ...lessonForm, content: e.target.value })}
              />
              <Input
                placeholder="Video link (optional)"
                maxLength={500}
                value={lessonForm.video_url}
                onChange={(e) => setLessonForm({ ...lessonForm, video_url: e.target.value })}
              />
              <Button onClick={addLesson} className="gap-2">
                <Plus className="h-4 w-4" /> Add Lesson
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
