import { useEffect, useMemo, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { FileText, Loader2, Download, Search, Users } from 'lucide-react';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Student { id: string; first_name: string; last_name: string; student_id: string; class_id: string | null; date_of_birth: string | null; }
interface ClassRow { id: string; name: string; grade_level: string; academic_year: string; }
interface Subject { id: string; name: string; code: string; }
interface MarkRow { student_id: string; subject_id: string; term: string; cat_score: number; exam_score: number; }

const TERMS: ('term1' | 'term2' | 'term3')[] = ['term1', 'term2', 'term3'];
const TERM_LABEL: Record<string, string> = { term1: 'TERM 1', term2: 'TERM 2', term3: 'TERM 3' };

interface StudentAggregate {
  student: Student;
  termTotals: Record<string, number>;
  termPct: Record<string, number>;
  annualTotal: number;
  annualPct: number;
  position?: number;
}

export default function AcademicReports() {
  const { role } = useAuth();
  const currentYear = `${new Date().getFullYear()}`;
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [marks, setMarks] = useState<MarkRow[]>([]);
  const [classId, setClassId] = useState('');
  const [year, setYear] = useState(currentYear);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const [c, s] = await Promise.all([
        supabase.from('classes').select('id, name, grade_level, academic_year').order('name'),
        supabase.from('subjects').select('id, name, code').order('name'),
      ]);
      setClasses(c.data || []);
      setSubjects(s.data || []);
    })();
  }, []);

  useEffect(() => {
    if (!classId) { setStudents([]); setMarks([]); return; }
    (async () => {
      setLoading(true);
      const { data: st } = await supabase.from('students').select('id, first_name, last_name, student_id, class_id, date_of_birth').eq('class_id', classId).order('last_name');
      setStudents(st || []);
      const ids = (st || []).map((x) => x.id);
      if (ids.length === 0) { setMarks([]); setLoading(false); return; }
      const { data: mk } = await supabase.from('marks').select('student_id, subject_id, term, cat_score, exam_score').in('student_id', ids).eq('academic_year', year);
      setMarks((mk || []).map((m: any) => ({ ...m, cat_score: Number(m.cat_score), exam_score: Number(m.exam_score) })));
      setLoading(false);
    })();
  }, [classId, year]);

  // Aggregate per student per term across all subjects
  const aggregates: StudentAggregate[] = useMemo(() => {
    const list: StudentAggregate[] = students.map((stu) => {
      const studentMarks = marks.filter((m) => m.student_id === stu.id);
      const termTotals: Record<string, number> = { term1: 0, term2: 0, term3: 0 };
      const termCounts: Record<string, number> = { term1: 0, term2: 0, term3: 0 };
      studentMarks.forEach((m) => {
        termTotals[m.term] += m.cat_score + m.exam_score;
        termCounts[m.term] += 1;
      });
      const termPct: Record<string, number> = {};
      TERMS.forEach((t) => { termPct[t] = termCounts[t] > 0 ? termTotals[t] / termCounts[t] : 0; });
      const totalCount = studentMarks.length;
      const annualTotal = termTotals.term1 + termTotals.term2 + termTotals.term3;
      const annualPct = totalCount > 0 ? annualTotal / totalCount : 0;
      return { student: stu, termTotals, termPct, annualTotal, annualPct };
    });
    // Rank by annual pct desc
    const ranked = [...list].sort((a, b) => b.annualPct - a.annualPct);
    ranked.forEach((a, i) => { a.position = i + 1; });
    return ranked;
  }, [students, marks]);

  const filtered = aggregates.filter((a) => `${a.student.first_name} ${a.student.last_name} ${a.student.student_id}`.toLowerCase().includes(search.toLowerCase()));

  const buildStudentReport = (doc: jsPDF, agg: StudentAggregate, cls: ClassRow | undefined, totalStudents: number) => {
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();

    // Title bar
    doc.setDrawColor(0); doc.setLineWidth(0.5);
    doc.rect(pageW / 2 - 60, 10, 120, 10);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(13);
    doc.text("STUDENT'S ASSESSMENT REPORT", pageW / 2, 17, { align: 'center' });

    // School info table
    autoTable(doc, {
      startY: 24,
      theme: 'grid',
      styles: { fontSize: 9, cellPadding: 1.5, textColor: 0, lineColor: 0, lineWidth: 0.2 },
      body: [
        [{ content: 'School Name: COLLEGE DE REBERO', colSpan: 2, styles: { fontStyle: 'bold' } }],
        [`Class: ${cls ? cls.name : '—'}`, `Grade Level: ${cls?.grade_level || '—'}`],
        [`Academic Year: ${year}`, `Class Size: ${totalStudents}`],
        [{ content: `Student Name: ${agg.student.first_name} ${agg.student.last_name}    |    Reg. No: ${agg.student.student_id}`, colSpan: 2, styles: { fontStyle: 'bold' } }],
      ],
    });
    let y = (doc as any).lastAutoTable.finalY + 4;

    // Per-subject marks table with terms side by side
    const subjectRows: any[] = [];
    const subjectIds = Array.from(new Set(marks.filter((m) => m.student_id === agg.student.id).map((m) => m.subject_id)));
    subjectIds.forEach((sid, idx) => {
      const subj = subjects.find((s) => s.id === sid);
      const cell = (term: string) => {
        const m = marks.find((x) => x.student_id === agg.student.id && x.subject_id === sid && x.term === term);
        return m ? [m.cat_score.toFixed(0), m.exam_score.toFixed(0), (m.cat_score + m.exam_score).toFixed(0)] : ['', '', ''];
      };
      const t1 = cell('term1'), t2 = cell('term2'), t3 = cell('term3');
      const totals = [t1, t2, t3].map((t) => t[2] ? Number(t[2]) : 0);
      const counted = totals.filter((v) => v > 0).length;
      const annual = counted > 0 ? (totals.reduce((s, v) => s + v, 0) / counted).toFixed(1) : '';
      subjectRows.push([
        idx + 1,
        `${subj?.code || ''} | ${subj?.name || '—'}`,
        ...t1, ...t2, ...t3,
        annual,
        annual ? `${annual}%` : '',
        annual ? (Number(annual) >= 50 ? 'PASS' : 'FAIL') : '',
      ]);
    });

    autoTable(doc, {
      startY: y,
      theme: 'grid',
      styles: { fontSize: 7.5, cellPadding: 1, textColor: 0, lineColor: 0, lineWidth: 0.2, halign: 'center' },
      headStyles: { fillColor: [220, 230, 241], textColor: 0, fontStyle: 'bold' },
      head: [
        [
          { content: '#', rowSpan: 2 },
          { content: 'MODULE CODE & TITLE', rowSpan: 2, styles: { halign: 'left' } },
          { content: 'TERM 1', colSpan: 3 },
          { content: 'TERM 2', colSpan: 3 },
          { content: 'TERM 3', colSpan: 3 },
          { content: 'Annual', rowSpan: 2 },
          { content: 'A.%', rowSpan: 2 },
          { content: 'DES', rowSpan: 2 },
        ],
        ['CAT', 'Exam', 'Tot', 'CAT', 'Exam', 'Tot', 'CAT', 'Exam', 'Tot'],
      ],
      body: subjectRows.length ? subjectRows : [[{ content: 'No marks recorded', colSpan: 13, styles: { halign: 'center', fontStyle: 'italic' } }]],
      columnStyles: { 1: { halign: 'left', cellWidth: 50 } },
    });
    y = (doc as any).lastAutoTable.finalY;

    // Summary row: TOTAL / PERCENTAGE / POSITION
    autoTable(doc, {
      startY: y,
      theme: 'grid',
      styles: { fontSize: 8.5, cellPadding: 1.5, textColor: 0, lineColor: 0, lineWidth: 0.2, halign: 'center', fontStyle: 'bold' },
      body: [
        ['TOTAL', agg.termTotals.term1.toFixed(0), agg.termTotals.term2.toFixed(0), agg.termTotals.term3.toFixed(0), agg.annualTotal.toFixed(0)],
        ['PERCENTAGE', `${agg.termPct.term1.toFixed(2)}%`, `${agg.termPct.term2.toFixed(2)}%`, `${agg.termPct.term3.toFixed(2)}%`, `${agg.annualPct.toFixed(2)}%`],
        ['POSITION', '', '', '', `${agg.position} out of ${totalStudents}`],
      ],
      columnStyles: { 0: { halign: 'left', fillColor: [240, 240, 245] } },
    });
    y = (doc as any).lastAutoTable.finalY + 12;

    // Signatures
    doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
    doc.text(`Done at College De Rebero, on ${new Date().toLocaleDateString()}`, 14, y);
    y += 14;
    doc.line(14, y, 80, y);
    doc.line(pageW - 80, y, pageW - 14, y);
    doc.setFontSize(9);
    doc.text('Class Teacher', 14, y + 5);
    doc.text('School Manager', pageW - 80, y + 5);

    doc.setFontSize(8); doc.setTextColor(120);
    doc.text(`College Report Manager • Generated ${new Date().toLocaleString()}`, pageW / 2, pageH - 8, { align: 'center' });
    doc.setTextColor(0);
  };

  const generateOne = async (agg: StudentAggregate) => {
    setGenerating(agg.student.id);
    try {
      const cls = classes.find((c) => c.id === classId);
      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      buildStudentReport(doc, agg, cls, aggregates.length);
      doc.save(`Report_${agg.student.first_name}_${agg.student.last_name}_${year}.pdf`);
      toast.success('Report downloaded');
    } catch (e: any) {
      toast.error(e.message || 'Failed to generate');
    } finally {
      setGenerating(null);
    }
  };

  const generateClassBatch = () => {
    if (aggregates.length === 0) return toast.error('No students');
    const cls = classes.find((c) => c.id === classId);
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    aggregates.forEach((agg, i) => {
      if (i > 0) doc.addPage();
      buildStudentReport(doc, agg, cls, aggregates.length);
    });
    doc.save(`Class_Reports_${cls?.name || 'class'}_${year}.pdf`);
    toast.success(`Generated ${aggregates.length} reports`);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Academic Reports</h1>
          <p className="mt-1 text-sm text-muted-foreground">Ranked class performance with downloadable termly reports</p>
        </div>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" /> Filters</CardTitle></CardHeader>
          <CardContent>
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <Label>Class</Label>
                <Select value={classId} onValueChange={setClassId}>
                  <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                  <SelectContent>
                    {classes.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name} — {c.grade_level} ({c.academic_year})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Academic Year</Label>
                <Input value={year} onChange={(e) => setYear(e.target.value)} placeholder="2026" />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Search Student</Label>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Name or ID..." className="pl-8" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {classId && (
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" /> Class Ranking ({aggregates.length})</CardTitle>
                <Button onClick={generateClassBatch} disabled={aggregates.length === 0}>
                  <Download className="h-4 w-4" /> Download All Reports
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
              ) : filtered.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">No students</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">Pos</TableHead>
                      <TableHead>Student</TableHead>
                      <TableHead>ID</TableHead>
                      <TableHead className="text-center">Term 1 %</TableHead>
                      <TableHead className="text-center">Term 2 %</TableHead>
                      <TableHead className="text-center">Term 3 %</TableHead>
                      <TableHead className="text-center font-bold">Annual %</TableHead>
                      <TableHead className="w-32">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((a) => (
                      <TableRow key={a.student.id}>
                        <TableCell className="font-bold">{a.position}</TableCell>
                        <TableCell className="font-medium">{a.student.first_name} {a.student.last_name}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{a.student.student_id}</TableCell>
                        <TableCell className="text-center">{a.termPct.term1 > 0 ? a.termPct.term1.toFixed(1) : '-'}</TableCell>
                        <TableCell className="text-center">{a.termPct.term2 > 0 ? a.termPct.term2.toFixed(1) : '-'}</TableCell>
                        <TableCell className="text-center">{a.termPct.term3 > 0 ? a.termPct.term3.toFixed(1) : '-'}</TableCell>
                        <TableCell className={`text-center font-bold ${a.annualPct >= 50 ? 'text-success' : 'text-destructive'}`}>
                          {a.annualPct.toFixed(2)}%
                        </TableCell>
                        <TableCell>
                          <Button size="sm" variant="outline" onClick={() => generateOne(a)} disabled={generating === a.student.id}>
                            {generating === a.student.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />} PDF
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
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