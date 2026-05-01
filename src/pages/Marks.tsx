import { useEffect, useState, useMemo } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { ClipboardList, Loader2, Save, Search } from 'lucide-react';
import { toast } from 'sonner';

interface Student { id: string; first_name: string; last_name: string; student_id: string; class_id: string | null; }
interface Subject { id: string; name: string; code: string; }
interface ClassRow { id: string; name: string; }
interface MarkRow { id?: string; student_id: string; cat_score: number; exam_score: number; remarks: string | null; }

const TERM_LABELS: Record<string, string> = { term1: 'Term 1', term2: 'Term 2', term3: 'Term 3' };

export default function Marks() {
  const { user, role } = useAuth();
  const currentYear = `${new Date().getFullYear()}`;
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [classId, setClassId] = useState<string>('');
  const [subjectId, setSubjectId] = useState<string>('');
  const [term, setTerm] = useState<'term1' | 'term2' | 'term3'>('term1');
  const [year, setYear] = useState<string>(currentYear);
  const [marks, setMarks] = useState<Record<string, MarkRow>>({});
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const canEdit = role === 'admin' || role === 'teacher';

  useEffect(() => {
    (async () => {
      const [c, s] = await Promise.all([
        supabase.from('classes').select('id, name').order('name'),
        supabase.from('subjects').select('id, name, code').order('name'),
      ]);
      setClasses(c.data || []);
      setSubjects(s.data || []);
    })();
  }, []);

  useEffect(() => {
    if (!classId) { setStudents([]); return; }
    (async () => {
      const { data } = await supabase.from('students').select('id, first_name, last_name, student_id, class_id').eq('class_id', classId).order('last_name');
      setStudents(data || []);
    })();
  }, [classId]);

  useEffect(() => {
    if (!classId || !subjectId) return;
    fetchMarks();
  }, [classId, subjectId, term, year]);

  const fetchMarks = async () => {
    if (!classId || !subjectId) return;
    setLoading(true);
    const { data: studs } = await supabase.from('students').select('id').eq('class_id', classId);
    const ids = (studs || []).map((s) => s.id);
    if (ids.length === 0) { setMarks({}); setLoading(false); return; }
    const { data } = await supabase.from('marks').select('*').in('student_id', ids).eq('subject_id', subjectId).eq('term', term).eq('academic_year', year);
    const map: Record<string, MarkRow> = {};
    (data || []).forEach((m: any) => {
      map[m.student_id] = { id: m.id, student_id: m.student_id, cat_score: Number(m.cat_score), exam_score: Number(m.exam_score), remarks: m.remarks };
    });
    setMarks(map);
    setLoading(false);
  };

  const updateMark = (studentId: string, field: 'cat_score' | 'exam_score' | 'remarks', value: any) => {
    setMarks((prev) => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || { student_id: studentId, cat_score: 0, exam_score: 0, remarks: '' }),
        [field]: value,
      },
    }));
  };

  const saveAll = async () => {
    if (!user || !subjectId) return;
    setSaving(true);
    const rows = Object.values(marks).map((m) => ({
      ...(m.id ? { id: m.id } : {}),
      student_id: m.student_id,
      subject_id: subjectId,
      teacher_id: user.id,
      term,
      academic_year: year,
      cat_score: Math.max(0, Math.min(40, Number(m.cat_score) || 0)),
      exam_score: Math.max(0, Math.min(60, Number(m.exam_score) || 0)),
      remarks: m.remarks || null,
    }));
    const { error } = await supabase.from('marks').upsert(rows, { onConflict: 'student_id,subject_id,term,academic_year' });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(`Saved marks for ${rows.length} student(s)`);
    fetchMarks();
  };

  const filteredStudents = useMemo(() => {
    const q = search.toLowerCase();
    return students.filter((s) => `${s.first_name} ${s.last_name} ${s.student_id}`.toLowerCase().includes(q));
  }, [students, search]);

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Marks Entry</h1>
          <p className="mt-1 text-sm text-muted-foreground">CAT (out of 40) + Exam (out of 60) per student per subject per term</p>
        </div>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><ClipboardList className="h-5 w-5" /> Filters</CardTitle></CardHeader>
          <CardContent>
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <Label>Class</Label>
                <Select value={classId} onValueChange={setClassId}>
                  <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                  <SelectContent>{classes.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Subject</Label>
                <Select value={subjectId} onValueChange={setSubjectId}>
                  <SelectTrigger><SelectValue placeholder="Select subject" /></SelectTrigger>
                  <SelectContent>{subjects.map((s) => <SelectItem key={s.id} value={s.id}>{s.name} ({s.code})</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Term</Label>
                <Select value={term} onValueChange={(v) => setTerm(v as any)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="term1">Term 1</SelectItem>
                    <SelectItem value="term2">Term 2</SelectItem>
                    <SelectItem value="term3">Term 3</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Academic Year</Label>
                <Input value={year} onChange={(e) => setYear(e.target.value)} placeholder="2026" />
              </div>
            </div>
          </CardContent>
        </Card>

        {classId && subjectId && (
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <CardTitle>Students — {TERM_LABELS[term]} {year}</CardTitle>
                <div className="flex gap-2">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search student..." className="pl-8 w-56" />
                  </div>
                  {canEdit && <Button onClick={saveAll} disabled={saving}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save All</Button>}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
              ) : filteredStudents.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">No students in this class</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>ID</TableHead>
                      <TableHead className="w-32">CAT (/40)</TableHead>
                      <TableHead className="w-32">Exam (/60)</TableHead>
                      <TableHead className="w-24">Total</TableHead>
                      <TableHead>Remarks</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStudents.map((s) => {
                      const m = marks[s.id] || { student_id: s.id, cat_score: 0, exam_score: 0, remarks: '' };
                      const total = Number(m.cat_score || 0) + Number(m.exam_score || 0);
                      return (
                        <TableRow key={s.id}>
                          <TableCell className="font-medium">{s.first_name} {s.last_name}</TableCell>
                          <TableCell className="text-muted-foreground text-xs">{s.student_id}</TableCell>
                          <TableCell>
                            <Input type="number" min={0} max={40} step={0.5} value={m.cat_score} disabled={!canEdit}
                              onChange={(e) => updateMark(s.id, 'cat_score', e.target.value)} className="h-9" />
                          </TableCell>
                          <TableCell>
                            <Input type="number" min={0} max={60} step={0.5} value={m.exam_score} disabled={!canEdit}
                              onChange={(e) => updateMark(s.id, 'exam_score', e.target.value)} className="h-9" />
                          </TableCell>
                          <TableCell>
                            <span className={`font-bold ${total >= 50 ? 'text-success' : 'text-destructive'}`}>{total.toFixed(1)}</span>
                          </TableCell>
                          <TableCell>
                            <Input value={m.remarks || ''} disabled={!canEdit} onChange={(e) => updateMark(s.id, 'remarks', e.target.value)} placeholder="Optional" className="h-9" />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
