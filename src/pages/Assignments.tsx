import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { useAuth } from '@/contexts/AuthContext';
import { useCurrentStudent } from '@/hooks/useCurrentStudent';
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, ClipboardList, Loader2, Send, GraduationCap, CalendarDays } from 'lucide-react';

interface Assignment {
  id: string;
  title: string;
  instructions: string | null;
  due_date: string | null;
  max_points: number;
  subject_id: string | null;
  class_id: string | null;
}

interface Submission {
  id: string;
  assignment_id: string;
  student_id: string;
  answer_text: string | null;
  file_url: string | null;
  submitted_at: string;
  points_awarded: number | null;
  feedback: string | null;
  student?: { first_name: string; last_name: string; student_id: string };
}

const emptyForm = {
  title: '',
  instructions: '',
  due_date: '',
  max_points: '20',
  subject_id: '',
  class_id: '',
};

export default function Assignments() {
  const { role, user } = useAuth();
  const { toast } = useToast();
  const { studentId } = useCurrentStudent();
  const isStaff = role === 'admin' || role === 'teacher';

  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [mySubmissions, setMySubmissions] = useState<Submission[]>([]);
  const [subjects, setSubjects] = useState<{ id: string; name: string }[]>([]);
  const [classes, setClasses] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const [submitFor, setSubmitFor] = useState<Assignment | null>(null);
  const [answer, setAnswer] = useState({ answer_text: '', file_url: '' });

  const [gradeFor, setGradeFor] = useState<Assignment | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);

  useEffect(() => {
    fetchAll();
  }, [studentId]);

  const fetchAll = async () => {
    setLoading(true);
    const [a, s, c] = await Promise.all([
      supabase.from('assignments').select('*').order('created_at', { ascending: false }),
      supabase.from('subjects').select('id, name').order('name'),
      supabase.from('classes').select('id, name').order('name'),
    ]);
    setAssignments((a.data as Assignment[]) || []);
    setSubjects(s.data || []);
    setClasses(c.data || []);
    if (studentId) {
      const { data } = await supabase.from('assignment_submissions').select('*').eq('student_id', studentId);
      setMySubmissions((data as Submission[]) || []);
    }
    setLoading(false);
  };

  const save = async () => {
    if (!form.title.trim()) {
      toast({ title: 'Title is required', variant: 'destructive' });
      return;
    }
    const points = Math.min(Math.max(Number(form.max_points) || 0, 1), 100);
    const { error } = await supabase.from('assignments').insert({
      title: form.title.trim().slice(0, 150),
      instructions: form.instructions.trim().slice(0, 3000) || null,
      due_date: form.due_date || null,
      max_points: points,
      subject_id: form.subject_id || null,
      class_id: form.class_id || null,
      created_by: user!.id,
      is_published: true,
    });
    if (error) {
      toast({ title: 'Could not create assignment', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'Assignment created' });
    setOpen(false);
    setForm(emptyForm);
    fetchAll();
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from('assignments').delete().eq('id', id);
    if (error) {
      toast({ title: 'Could not delete', description: error.message, variant: 'destructive' });
      return;
    }
    fetchAll();
  };

  const submitWork = async () => {
    if (!submitFor || !studentId) return;
    if (!answer.answer_text.trim() && !answer.file_url.trim()) {
      toast({ title: 'Add an answer or a file link', variant: 'destructive' });
      return;
    }
    const existing = mySubmissions.find((s) => s.assignment_id === submitFor.id);
    const payload = {
      assignment_id: submitFor.id,
      student_id: studentId,
      answer_text: answer.answer_text.trim().slice(0, 5000) || null,
      file_url: answer.file_url.trim().slice(0, 500) || null,
      submitted_at: new Date().toISOString(),
    };
    const { error } = existing
      ? await supabase.from('assignment_submissions').update(payload).eq('id', existing.id)
      : await supabase.from('assignment_submissions').insert(payload);
    if (error) {
      toast({ title: 'Could not submit', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'Work submitted' });
    setSubmitFor(null);
    setAnswer({ answer_text: '', file_url: '' });
    fetchAll();
  };

  const openGrading = async (assignment: Assignment) => {
    setGradeFor(assignment);
    const { data } = await supabase
      .from('assignment_submissions')
      .select('*, student:students(first_name, last_name, student_id)')
      .eq('assignment_id', assignment.id)
      .order('submitted_at', { ascending: false });
    setSubmissions((data as unknown as Submission[]) || []);
  };

  const grade = async (submission: Submission, points: string, feedback: string) => {
    if (!gradeFor) return;
    const value = Math.min(Math.max(Number(points) || 0, 0), gradeFor.max_points);
    const { error } = await supabase
      .from('assignment_submissions')
      .update({ points_awarded: value, feedback: feedback.slice(0, 1000) || null, graded_by: user!.id })
      .eq('id', submission.id);
    if (error) {
      toast({ title: 'Could not save grade', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'Grade saved' });
    openGrading(gradeFor);
  };

  const label = (list: { id: string; name: string }[], id: string | null) => list.find((x) => x.id === id)?.name;

  return (
    <DashboardLayout>
      <PageHeader
        eyebrow="E-learning"
        title="Assignments"
        description={
          isStaff
            ? 'Post assignments with due dates, then review and grade student submissions.'
            : 'View assignments, submit your work and see your marks and feedback.'
        }
        actions={
          isStaff ? (
            <Button className="gap-2" onClick={() => setOpen(true)}>
              <Plus className="h-4 w-4" /> New Assignment
            </Button>
          ) : undefined
        }
      />

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : assignments.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-14 text-center">
            <ClipboardList className="mb-3 h-10 w-10 text-muted-foreground" />
            <p className="font-medium text-foreground">No assignments yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {assignments.map((a) => {
            const mine = mySubmissions.find((s) => s.assignment_id === a.id);
            const overdue = a.due_date && new Date(a.due_date) < new Date() && !mine;
            return (
              <Card key={a.id} className="flex flex-col rounded-2xl">
                <CardContent className="flex flex-1 flex-col gap-3 p-5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <ClipboardList className="h-5 w-5" />
                    </div>
                    {mine ? (
                      <Badge variant="default">
                        {mine.points_awarded != null ? `${mine.points_awarded}/${a.max_points}` : 'Submitted'}
                      </Badge>
                    ) : overdue ? (
                      <Badge variant="destructive">Overdue</Badge>
                    ) : (
                      <Badge variant="secondary">{a.max_points} pts</Badge>
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{a.title}</h3>
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                      {a.instructions || 'No instructions provided.'}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1.5 text-[11px] text-muted-foreground">
                    {a.due_date && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5">
                        <CalendarDays className="h-3 w-3" /> Due {new Date(a.due_date).toLocaleDateString()}
                      </span>
                    )}
                    {label(subjects, a.subject_id) && (
                      <span className="rounded-full bg-muted px-2 py-0.5">{label(subjects, a.subject_id)}</span>
                    )}
                    {label(classes, a.class_id) && (
                      <span className="rounded-full bg-muted px-2 py-0.5">{label(classes, a.class_id)}</span>
                    )}
                  </div>
                  {mine?.feedback && (
                    <p className="rounded-xl bg-muted p-2.5 text-xs text-muted-foreground">
                      Teacher feedback: {mine.feedback}
                    </p>
                  )}
                  <div className="mt-auto flex items-center gap-2 pt-2">
                    {isStaff ? (
                      <>
                        <Button variant="outline" size="sm" className="gap-1.5" onClick={() => openGrading(a)}>
                          <GraduationCap className="h-4 w-4" /> Submissions
                        </Button>
                        <Button variant="ghost" size="icon" aria-label="Delete assignment" onClick={() => remove(a.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </>
                    ) : role === 'student' ? (
                      <Button
                        size="sm"
                        className="gap-1.5"
                        onClick={() => {
                          setSubmitFor(a);
                          setAnswer({ answer_text: mine?.answer_text || '', file_url: mine?.file_url || '' });
                        }}
                      >
                        <Send className="h-4 w-4" /> {mine ? 'Update Work' : 'Submit Work'}
                      </Button>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create assignment */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New Assignment</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Title</Label>
              <Input value={form.title} maxLength={150} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div>
              <Label>Instructions</Label>
              <Textarea
                value={form.instructions}
                maxLength={3000}
                onChange={(e) => setForm({ ...form, instructions: e.target.value })}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label>Due date</Label>
                <Input
                  type="date"
                  value={form.due_date}
                  onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                />
              </div>
              <div>
                <Label>Max points</Label>
                <Input
                  type="number"
                  min={1}
                  max={100}
                  value={form.max_points}
                  onChange={(e) => setForm({ ...form, max_points: e.target.value })}
                />
              </div>
              <div>
                <Label>Subject</Label>
                <Select value={form.subject_id} onValueChange={(v) => setForm({ ...form, subject_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Select subject" /></SelectTrigger>
                  <SelectContent>
                    {subjects.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Class</Label>
                <Select value={form.class_id} onValueChange={(v) => setForm({ ...form, class_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                  <SelectContent>
                    {classes.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Student submit */}
      <Dialog open={!!submitFor} onOpenChange={(o) => !o && setSubmitFor(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{submitFor?.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Your answer</Label>
              <Textarea
                value={answer.answer_text}
                maxLength={5000}
                onChange={(e) => setAnswer({ ...answer, answer_text: e.target.value })}
                placeholder="Type your work here"
              />
            </div>
            <div>
              <Label>File link (optional)</Label>
              <Input
                value={answer.file_url}
                maxLength={500}
                placeholder="https://..."
                onChange={(e) => setAnswer({ ...answer, file_url: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSubmitFor(null)}>Cancel</Button>
            <Button onClick={submitWork}>Submit</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Grading */}
      <Dialog open={!!gradeFor} onOpenChange={(o) => !o && setGradeFor(null)}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{gradeFor?.title} — Submissions</DialogTitle>
          </DialogHeader>
          {submissions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No submissions yet.</p>
          ) : (
            <div className="space-y-3">
              {submissions.map((s) => (
                <GradeRow key={s.id} submission={s} maxPoints={gradeFor?.max_points || 20} onGrade={grade} />
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}

function GradeRow({
  submission,
  maxPoints,
  onGrade,
}: {
  submission: Submission;
  maxPoints: number;
  onGrade: (s: Submission, points: string, feedback: string) => void;
}) {
  const [points, setPoints] = useState(submission.points_awarded?.toString() || '');
  const [feedback, setFeedback] = useState(submission.feedback || '');

  return (
    <div className="space-y-2 rounded-xl border border-border p-3">
      <p className="text-sm font-semibold text-foreground">
        {submission.student ? `${submission.student.first_name} ${submission.student.last_name}` : 'Student'}
        <span className="ml-2 text-xs font-normal text-muted-foreground">
          {submission.student?.student_id} · {new Date(submission.submitted_at).toLocaleString()}
        </span>
      </p>
      {submission.answer_text && (
        <p className="whitespace-pre-wrap rounded-lg bg-muted p-2.5 text-sm text-muted-foreground">
          {submission.answer_text}
        </p>
      )}
      {submission.file_url && (
        <a href={submission.file_url} target="_blank" rel="noreferrer" className="text-sm text-secondary underline">
          Open submitted file
        </a>
      )}
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          type="number"
          min={0}
          max={maxPoints}
          className="sm:w-32"
          placeholder={`0-${maxPoints}`}
          value={points}
          onChange={(e) => setPoints(e.target.value)}
        />
        <Input
          placeholder="Feedback"
          maxLength={1000}
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
        />
        <Button size="sm" onClick={() => onGrade(submission, points, feedback)}>
          Save
        </Button>
      </div>
    </div>
  );
}
