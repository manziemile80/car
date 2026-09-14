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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, ListChecks, Loader2, PenLine, BarChart3 } from 'lucide-react';

interface Quiz {
  id: string;
  title: string;
  description: string | null;
  subject_id: string | null;
  class_id: string | null;
  time_limit_minutes: number | null;
  is_published: boolean;
}

interface Question {
  id: string;
  quiz_id: string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string | null;
  option_d: string | null;
  correct_option: string;
  points: number;
  sort_order: number;
}

interface Attempt {
  id: string;
  quiz_id: string;
  student_id: string;
  score: number;
  total_points: number;
  completed_at: string;
  student?: { first_name: string; last_name: string };
}

const emptyQuiz = { title: '', description: '', subject_id: '', class_id: '', time_limit_minutes: '', is_published: true };
const emptyQuestion = { question_text: '', option_a: '', option_b: '', option_c: '', option_d: '', correct_option: 'a', points: '1' };

export default function Quizzes() {
  const { role, user } = useAuth();
  const { toast } = useToast();
  const { studentId } = useCurrentStudent();
  const isStaff = role === 'admin' || role === 'teacher';

  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [subjects, setSubjects] = useState<{ id: string; name: string }[]>([]);
  const [classes, setClasses] = useState<{ id: string; name: string }[]>([]);
  const [myAttempts, setMyAttempts] = useState<Attempt[]>([]);
  const [loading, setLoading] = useState(true);

  const [quizOpen, setQuizOpen] = useState(false);
  const [quizForm, setQuizForm] = useState(emptyQuiz);

  const [manageQuiz, setManageQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [questionForm, setQuestionForm] = useState(emptyQuestion);

  const [takeQuiz, setTakeQuiz] = useState<Quiz | null>(null);
  const [takeQuestions, setTakeQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const [resultsQuiz, setResultsQuiz] = useState<Quiz | null>(null);
  const [attempts, setAttempts] = useState<Attempt[]>([]);

  useEffect(() => {
    fetchAll();
  }, [studentId]);

  const fetchAll = async () => {
    setLoading(true);
    const [q, s, c] = await Promise.all([
      supabase.from('quizzes').select('*').order('created_at', { ascending: false }),
      supabase.from('subjects').select('id, name').order('name'),
      supabase.from('classes').select('id, name').order('name'),
    ]);
    setQuizzes((q.data as Quiz[]) || []);
    setSubjects(s.data || []);
    setClasses(c.data || []);
    if (studentId) {
      const { data } = await supabase.from('quiz_attempts').select('*').eq('student_id', studentId);
      setMyAttempts((data as Attempt[]) || []);
    }
    setLoading(false);
  };

  const saveQuiz = async () => {
    if (!quizForm.title.trim()) {
      toast({ title: 'Title is required', variant: 'destructive' });
      return;
    }
    const { error } = await supabase.from('quizzes').insert({
      title: quizForm.title.trim().slice(0, 150),
      description: quizForm.description.trim().slice(0, 1000) || null,
      subject_id: quizForm.subject_id || null,
      class_id: quizForm.class_id || null,
      time_limit_minutes: quizForm.time_limit_minutes ? Number(quizForm.time_limit_minutes) : null,
      is_published: quizForm.is_published,
      created_by: user!.id,
    });
    if (error) {
      toast({ title: 'Could not create quiz', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'Quiz created' });
    setQuizOpen(false);
    setQuizForm(emptyQuiz);
    fetchAll();
  };

  const removeQuiz = async (id: string) => {
    const { error } = await supabase.from('quizzes').delete().eq('id', id);
    if (error) {
      toast({ title: 'Could not delete', description: error.message, variant: 'destructive' });
      return;
    }
    fetchAll();
  };

  const openManage = async (quiz: Quiz) => {
    setManageQuiz(quiz);
    setQuestionForm(emptyQuestion);
    const { data } = await supabase.from('quiz_questions').select('*').eq('quiz_id', quiz.id).order('sort_order');
    setQuestions((data as Question[]) || []);
  };

  const addQuestion = async () => {
    if (!manageQuiz) return;
    if (!questionForm.question_text.trim() || !questionForm.option_a.trim() || !questionForm.option_b.trim()) {
      toast({ title: 'Question and options A/B are required', variant: 'destructive' });
      return;
    }
    const { error } = await supabase.from('quiz_questions').insert({
      quiz_id: manageQuiz.id,
      question_text: questionForm.question_text.trim().slice(0, 1000),
      option_a: questionForm.option_a.trim().slice(0, 300),
      option_b: questionForm.option_b.trim().slice(0, 300),
      option_c: questionForm.option_c.trim().slice(0, 300) || null,
      option_d: questionForm.option_d.trim().slice(0, 300) || null,
      correct_option: questionForm.correct_option,
      points: Math.min(Math.max(Number(questionForm.points) || 1, 1), 20),
      sort_order: questions.length + 1,
    });
    if (error) {
      toast({ title: 'Could not add question', description: error.message, variant: 'destructive' });
      return;
    }
    openManage(manageQuiz);
  };

  const removeQuestion = async (id: string) => {
    await supabase.from('quiz_questions').delete().eq('id', id);
    if (manageQuiz) openManage(manageQuiz);
  };

  const startQuiz = async (quiz: Quiz) => {
    const { data } = await supabase.from('quiz_questions').select('*').eq('quiz_id', quiz.id).order('sort_order');
    setTakeQuestions((data as Question[]) || []);
    setAnswers({});
    setTakeQuiz(quiz);
  };

  const submitQuiz = async () => {
    if (!takeQuiz || !studentId) return;
    let score = 0;
    let total = 0;
    takeQuestions.forEach((q) => {
      total += Number(q.points);
      if (answers[q.id] === q.correct_option) score += Number(q.points);
    });
    const { error } = await supabase.from('quiz_attempts').insert({
      quiz_id: takeQuiz.id,
      student_id: studentId,
      answers,
      score,
      total_points: total,
    });
    if (error) {
      toast({ title: 'Could not submit quiz', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'Quiz submitted', description: `You scored ${score}/${total}` });
    setTakeQuiz(null);
    fetchAll();
  };

  const openResults = async (quiz: Quiz) => {
    setResultsQuiz(quiz);
    const { data } = await supabase
      .from('quiz_attempts')
      .select('*, student:students(first_name, last_name)')
      .eq('quiz_id', quiz.id)
      .order('score', { ascending: false });
    setAttempts((data as unknown as Attempt[]) || []);
  };

  const label = (list: { id: string; name: string }[], id: string | null) => list.find((x) => x.id === id)?.name;

  return (
    <DashboardLayout>
      <PageHeader
        eyebrow="E-Learning"
        title="Quizzes"
        description={
          isStaff
            ? 'Build multiple-choice quizzes and review auto-scored student results.'
            : 'Take published quizzes and see your score instantly.'
        }
        actions={
          isStaff ? (
            <Button className="gap-2" onClick={() => setQuizOpen(true)}>
              <Plus className="h-4 w-4" /> New Quiz
            </Button>
          ) : undefined
        }
      />

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : quizzes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-14 text-center">
            <ListChecks className="mb-3 h-10 w-10 text-muted-foreground" />
            <p className="font-medium text-foreground">No quizzes yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {quizzes.map((quiz) => {
            const attempt = myAttempts.find((a) => a.quiz_id === quiz.id);
            return (
              <Card key={quiz.id} className="flex flex-col rounded-2xl">
                <CardContent className="flex flex-1 flex-col gap-3 p-5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-info/15 text-info">
                      <ListChecks className="h-5 w-5" />
                    </div>
                    {attempt ? (
                      <Badge variant="default">{attempt.score}/{attempt.total_points}</Badge>
                    ) : (
                      <Badge variant={quiz.is_published ? 'secondary' : 'outline'}>
                        {quiz.is_published ? 'Open' : 'Draft'}
                      </Badge>
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{quiz.title}</h3>
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                      {quiz.description || 'No description'}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1.5 text-[11px] text-muted-foreground">
                    {label(subjects, quiz.subject_id) && (
                      <span className="rounded-full bg-muted px-2 py-0.5">{label(subjects, quiz.subject_id)}</span>
                    )}
                    {label(classes, quiz.class_id) && (
                      <span className="rounded-full bg-muted px-2 py-0.5">{label(classes, quiz.class_id)}</span>
                    )}
                    {quiz.time_limit_minutes && (
                      <span className="rounded-full bg-muted px-2 py-0.5">{quiz.time_limit_minutes} min</span>
                    )}
                  </div>
                  <div className="mt-auto flex flex-wrap items-center gap-2 pt-2">
                    {isStaff ? (
                      <>
                        <Button variant="outline" size="sm" className="gap-1.5" onClick={() => openManage(quiz)}>
                          <PenLine className="h-4 w-4" /> Questions
                        </Button>
                        <Button variant="outline" size="sm" className="gap-1.5" onClick={() => openResults(quiz)}>
                          <BarChart3 className="h-4 w-4" /> Results
                        </Button>
                        <Button variant="ghost" size="icon" aria-label="Delete quiz" onClick={() => removeQuiz(quiz.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </>
                    ) : role === 'student' && !attempt ? (
                      <Button size="sm" onClick={() => startQuiz(quiz)}>Start Quiz</Button>
                    ) : attempt ? (
                      <p className="text-xs text-muted-foreground">
                        Completed {new Date(attempt.completed_at).toLocaleDateString()}
                      </p>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create quiz */}
      <Dialog open={quizOpen} onOpenChange={setQuizOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New Quiz</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Title</Label>
              <Input value={quizForm.title} maxLength={150} onChange={(e) => setQuizForm({ ...quizForm, title: e.target.value })} />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={quizForm.description}
                maxLength={1000}
                onChange={(e) => setQuizForm({ ...quizForm, description: e.target.value })}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label>Subject</Label>
                <Select value={quizForm.subject_id} onValueChange={(v) => setQuizForm({ ...quizForm, subject_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Select subject" /></SelectTrigger>
                  <SelectContent>
                    {subjects.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Class</Label>
                <Select value={quizForm.class_id} onValueChange={(v) => setQuizForm({ ...quizForm, class_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                  <SelectContent>
                    {classes.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Time limit (minutes)</Label>
                <Input
                  type="number"
                  min={1}
                  max={300}
                  value={quizForm.time_limit_minutes}
                  onChange={(e) => setQuizForm({ ...quizForm, time_limit_minutes: e.target.value })}
                />
              </div>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-border p-3">
              <div>
                <p className="text-sm font-medium text-foreground">Published</p>
                <p className="text-xs text-muted-foreground">Students can take it once published</p>
              </div>
              <Switch
                checked={quizForm.is_published}
                onCheckedChange={(v) => setQuizForm({ ...quizForm, is_published: v })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setQuizOpen(false)}>Cancel</Button>
            <Button onClick={saveQuiz}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manage questions */}
      <Dialog open={!!manageQuiz} onOpenChange={(o) => !o && setManageQuiz(null)}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{manageQuiz?.title} — Questions</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            {questions.length === 0 && <p className="text-sm text-muted-foreground">No questions yet.</p>}
            {questions.map((q, i) => (
              <div key={q.id} className="flex items-start justify-between gap-2 rounded-xl border border-border p-3">
                <div>
                  <p className="text-sm font-medium text-foreground">{i + 1}. {q.question_text}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    A) {q.option_a} · B) {q.option_b}
                    {q.option_c ? ` · C) ${q.option_c}` : ''}{q.option_d ? ` · D) ${q.option_d}` : ''}
                  </p>
                  <p className="mt-1 text-xs font-medium text-success">
                    Correct: {q.correct_option.toUpperCase()} · {q.points} pt(s)
                  </p>
                </div>
                <Button variant="ghost" size="icon" aria-label="Delete question" onClick={() => removeQuestion(q.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
          <div className="space-y-2 rounded-xl border border-dashed border-border p-3">
            <p className="text-sm font-medium text-foreground">Add a question</p>
            <Textarea
              placeholder="Question"
              maxLength={1000}
              value={questionForm.question_text}
              onChange={(e) => setQuestionForm({ ...questionForm, question_text: e.target.value })}
            />
            <div className="grid gap-2 sm:grid-cols-2">
              <Input placeholder="Option A" maxLength={300} value={questionForm.option_a} onChange={(e) => setQuestionForm({ ...questionForm, option_a: e.target.value })} />
              <Input placeholder="Option B" maxLength={300} value={questionForm.option_b} onChange={(e) => setQuestionForm({ ...questionForm, option_b: e.target.value })} />
              <Input placeholder="Option C (optional)" maxLength={300} value={questionForm.option_c} onChange={(e) => setQuestionForm({ ...questionForm, option_c: e.target.value })} />
              <Input placeholder="Option D (optional)" maxLength={300} value={questionForm.option_d} onChange={(e) => setQuestionForm({ ...questionForm, option_d: e.target.value })} />
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <div>
                <Label>Correct option</Label>
                <Select
                  value={questionForm.correct_option}
                  onValueChange={(v) => setQuestionForm({ ...questionForm, correct_option: v })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="a">A</SelectItem>
                    <SelectItem value="b">B</SelectItem>
                    <SelectItem value="c">C</SelectItem>
                    <SelectItem value="d">D</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Points</Label>
                <Input
                  type="number"
                  min={1}
                  max={20}
                  value={questionForm.points}
                  onChange={(e) => setQuestionForm({ ...questionForm, points: e.target.value })}
                />
              </div>
            </div>
            <Button className="gap-2" onClick={addQuestion}>
              <Plus className="h-4 w-4" /> Add Question
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Take quiz */}
      <Dialog open={!!takeQuiz} onOpenChange={(o) => !o && setTakeQuiz(null)}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{takeQuiz?.title}</DialogTitle>
          </DialogHeader>
          {takeQuestions.length === 0 ? (
            <p className="text-sm text-muted-foreground">This quiz has no questions yet.</p>
          ) : (
            <div className="space-y-4">
              {takeQuestions.map((q, i) => (
                <div key={q.id} className="space-y-2 rounded-xl border border-border p-3">
                  <p className="text-sm font-medium text-foreground">{i + 1}. {q.question_text}</p>
                  <RadioGroup
                    value={answers[q.id] || ''}
                    onValueChange={(v) => setAnswers({ ...answers, [q.id]: v })}
                  >
                    {(['a', 'b', 'c', 'd'] as const).map((key) => {
                      const text = q[`option_${key}` as 'option_a'];
                      if (!text) return null;
                      return (
                        <div key={key} className="flex items-center gap-2">
                          <RadioGroupItem value={key} id={`${q.id}-${key}`} />
                          <Label htmlFor={`${q.id}-${key}`} className="text-sm font-normal">
                            {key.toUpperCase()}) {text}
                          </Label>
                        </div>
                      );
                    })}
                  </RadioGroup>
                </div>
              ))}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setTakeQuiz(null)}>Cancel</Button>
            <Button onClick={submitQuiz} disabled={takeQuestions.length === 0}>Submit Answers</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Results */}
      <Dialog open={!!resultsQuiz} onOpenChange={(o) => !o && setResultsQuiz(null)}>
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{resultsQuiz?.title} — Results</DialogTitle>
          </DialogHeader>
          {attempts.length === 0 ? (
            <p className="text-sm text-muted-foreground">No attempts yet.</p>
          ) : (
            <div className="space-y-2">
              {attempts.map((a, i) => (
                <div key={a.id} className="flex items-center justify-between rounded-xl border border-border p-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {i + 1}. {a.student ? `${a.student.first_name} ${a.student.last_name}` : 'Student'}
                    </p>
                    <p className="text-xs text-muted-foreground">{new Date(a.completed_at).toLocaleString()}</p>
                  </div>
                  <Badge>{a.score}/{a.total_points}</Badge>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
