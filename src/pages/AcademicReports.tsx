import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { FileText, Loader2, Download, Search } from 'lucide-react';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Student { id: string; first_name: string; last_name: string; student_id: string; class_id: string | null; date_of_birth: string | null; }
interface ClassRow { id: string; name: string; grade_level: string; }

const TERM_LABELS: Record<string, string> = { term1: 'Term 1', term2: 'Term 2', term3: 'Term 3' };

export default function AcademicReports() {
  const { role } = useAuth();
  const currentYear = `${new Date().getFullYear()}`;
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [classId, setClassId] = useState('');
  const [term, setTerm] = useState<'term1' | 'term2' | 'term3'>('term1');
  const [year, setYear] = useState(currentYear);
  const [search, setSearch] = useState('');
  const [generating, setGenerating] = useState<string | null>(null);
  const [remarksMap, setRemarksMap] = useState<Record<string, { class_teacher_remark: string; principal_remark: string }>>({});

  const canEditRemarks = role === 'admin' || role === 'teacher';

  useEffect(() => {
    supabase.from('classes').select('id, name, grade_level').order('name').then(({ data }) => setClasses(data || []));
  }, []);

  useEffect(() => {
    if (!classId) { setStudents([]); return; }
    supabase.from('students').select('id, first_name, last_name, student_id, class_id, date_of_birth').eq('class_id', classId).order('last_name').then(({ data }) => setStudents(data || []));
  }, [classId]);

  const filtered = students.filter((s) => `${s.first_name} ${s.last_name} ${s.student_id}`.toLowerCase().includes(search.toLowerCase()));

  const saveRemark = async (studentId: string) => {
    const r = remarksMap[studentId];
    if (!r) return;
    const { error } = await supabase.from('report_remarks').upsert({
      student_id: studentId, term, academic_year: year,
      class_teacher_remark: r.class_teacher_remark || null,
      principal_remark: r.principal_remark || null,
    }, { onConflict: 'student_id,term,academic_year' });
    if (error) toast.error(error.message);
    else toast.success('Remarks saved');
  };

  const generatePDF = async (student: Student) => {
    setGenerating(student.id);
    try {
      // Fetch marks
      const { data: marks } = await supabase
        .from('marks')
        .select('*, subject:subjects(name, code)')
        .eq('student_id', student.id).eq('term', term).eq('academic_year', year);

      // Fetch attendance summary for the year
      const { data: att } = await supabase.from('attendance').select('status').eq('student_id', student.id);
      const attCounts = { present: 0, absent: 0, late: 0, excused: 0 } as Record<string, number>;
      (att || []).forEach((r: any) => { attCounts[r.status] = (attCounts[r.status] || 0) + 1; });
      const attTotal = (att || []).length;

      // Position
      const { data: posData } = await supabase.rpc('get_student_term_position', {
        _student_id: student.id, _term: term, _academic_year: year,
      });
      const position = posData?.[0]?.rank_position ?? null;
      const totalStudents = posData?.[0]?.total_students ?? null;

      // Class
      const cls = classes.find((c) => c.id === student.class_id);

      // Remarks
      const { data: rem } = await supabase.from('report_remarks').select('*').eq('student_id', student.id).eq('term', term).eq('academic_year', year).maybeSingle();

      const totalAll = (marks || []).reduce((sum: number, m: any) => sum + Number(m.cat_score) + Number(m.exam_score), 0);
      const avg = (marks || []).length > 0 ? totalAll / (marks || []).length : 0;

      // Build PDF
      const doc = new jsPDF();
      const pageW = doc.internal.pageSize.getWidth();

      // Header
      doc.setFillColor(28, 56, 102);
      doc.rect(0, 0, pageW, 28, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18); doc.setFont('helvetica', 'bold');
      doc.text('COLLEGE DE REBERO', pageW / 2, 12, { align: 'center' });
      doc.setFontSize(11); doc.setFont('helvetica', 'normal');
      doc.text('Academic Performance Report', pageW / 2, 20, { align: 'center' });

      doc.setTextColor(0, 0, 0);
      let y = 38;
      doc.setFontSize(13); doc.setFont('helvetica', 'bold');
      doc.text(`${TERM_LABELS[term]} — ${year}`, pageW / 2, y, { align: 'center' });
      y += 10;

      // Student info box
      doc.setFontSize(10); doc.setFont('helvetica', 'normal');
      const info = [
        ['Student Name', `${student.first_name} ${student.last_name}`],
        ['Student ID', student.student_id],
        ['Class', cls ? `${cls.name} (${cls.grade_level})` : '—'],
        ['Date of Birth', student.date_of_birth || '—'],
      ];
      autoTable(doc, {
        startY: y,
        body: info,
        theme: 'grid',
        styles: { fontSize: 10, cellPadding: 2 },
        columnStyles: { 0: { fontStyle: 'bold', fillColor: [240, 240, 245], cellWidth: 45 } },
      });
      y = (doc as any).lastAutoTable.finalY + 8;

      // Marks table
      doc.setFontSize(12); doc.setFont('helvetica', 'bold');
      doc.text('Subject Marks', 14, y); y += 2;
      const markRows = (marks || []).map((m: any) => {
        const cat = Number(m.cat_score), exam = Number(m.exam_score), tot = cat + exam;
        return [m.subject?.name || '—', m.subject?.code || '—', cat.toFixed(1), exam.toFixed(1), tot.toFixed(1), `${tot.toFixed(1)}%`, m.remarks || ''];
      });
      autoTable(doc, {
        startY: y + 2,
        head: [['Subject', 'Code', 'CAT/40', 'Exam/60', 'Total/100', 'Percent', 'Remarks']],
        body: markRows.length ? markRows : [['No marks recorded', '', '', '', '', '', '']],
        theme: 'striped',
        headStyles: { fillColor: [28, 56, 102], textColor: 255 },
        styles: { fontSize: 9, cellPadding: 2 },
      });
      y = (doc as any).lastAutoTable.finalY + 6;

      // Summary
      autoTable(doc, {
        startY: y,
        body: [
          ['Total Marks', totalAll.toFixed(1)],
          ['Average', `${avg.toFixed(1)}%`],
          ['Class Position', position ? `${position} / ${totalStudents}` : '—'],
        ],
        theme: 'grid',
        styles: { fontSize: 10, cellPadding: 2 },
        columnStyles: { 0: { fontStyle: 'bold', fillColor: [240, 240, 245], cellWidth: 60 } },
      });
      y = (doc as any).lastAutoTable.finalY + 6;

      // Attendance
      doc.setFontSize(12); doc.setFont('helvetica', 'bold');
      doc.text('Attendance Summary', 14, y); y += 2;
      autoTable(doc, {
        startY: y + 2,
        head: [['Present', 'Absent', 'Late', 'Excused', 'Total Days']],
        body: [[attCounts.present, attCounts.absent, attCounts.late, attCounts.excused, attTotal]],
        theme: 'grid',
        headStyles: { fillColor: [28, 56, 102], textColor: 255 },
        styles: { fontSize: 10, halign: 'center' },
      });
      y = (doc as any).lastAutoTable.finalY + 8;

      // Remarks
      doc.setFontSize(11); doc.setFont('helvetica', 'bold');
      doc.text('Class Teacher Remark:', 14, y); y += 5;
      doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
      const ctr = rem?.class_teacher_remark || remarksMap[student.id]?.class_teacher_remark || '';
      doc.text(doc.splitTextToSize(ctr || '—', pageW - 28), 14, y);
      y += Math.max(8, doc.splitTextToSize(ctr || '—', pageW - 28).length * 5) + 4;

      doc.setFont('helvetica', 'bold'); doc.setFontSize(11);
      doc.text('Principal Remark:', 14, y); y += 5;
      doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
      const pr = rem?.principal_remark || remarksMap[student.id]?.principal_remark || '';
      doc.text(doc.splitTextToSize(pr || '—', pageW - 28), 14, y);
      y += Math.max(8, doc.splitTextToSize(pr || '—', pageW - 28).length * 5) + 12;

      // Signature line
      doc.setDrawColor(100); doc.line(14, y, 80, y); doc.line(pageW - 80, y, pageW - 14, y);
      doc.setFontSize(9); doc.text('Class Teacher', 14, y + 5); doc.text('Principal', pageW - 80, y + 5);

      // Footer
      const pageH = doc.internal.pageSize.getHeight();
      doc.setFontSize(8); doc.setTextColor(120);
      doc.text(`Generated on ${new Date().toLocaleDateString()} • College De Rebero`, pageW / 2, pageH - 8, { align: 'center' });

      doc.save(`Report_${student.first_name}_${student.last_name}_${TERM_LABELS[term].replace(' ', '')}_${year}.pdf`);
      toast.success('Report downloaded');
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || 'Failed to generate report');
    } finally {
      setGenerating(null);
    }
  };

  const loadRemarks = async (studentId: string) => {
    if (remarksMap[studentId]) return;
    const { data } = await supabase.from('report_remarks').select('*').eq('student_id', studentId).eq('term', term).eq('academic_year', year).maybeSingle();
    setRemarksMap((p) => ({ ...p, [studentId]: { class_teacher_remark: data?.class_teacher_remark || '', principal_remark: data?.principal_remark || '' } }));
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Academic Reports</h1>
          <p className="mt-1 text-sm text-muted-foreground">Generate termly PDF report cards for College De Rebero students</p>
        </div>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" /> Filters</CardTitle></CardHeader>
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
                <Input value={year} onChange={(e) => setYear(e.target.value)} />
              </div>
              <div className="space-y-2">
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
            <CardHeader><CardTitle>Students ({filtered.length})</CardTitle></CardHeader>
            <CardContent>
              {filtered.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">No students</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>ID</TableHead>
                      {canEditRemarks && <TableHead>Class Teacher Remark</TableHead>}
                      {canEditRemarks && <TableHead>Principal Remark</TableHead>}
                      <TableHead className="w-44">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((s) => {
                      const r = remarksMap[s.id] || { class_teacher_remark: '', principal_remark: '' };
                      return (
                        <TableRow key={s.id}>
                          <TableCell className="font-medium">{s.first_name} {s.last_name}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{s.student_id}</TableCell>
                          {canEditRemarks && (
                            <TableCell>
                              <Textarea rows={2} className="min-h-[60px]" value={r.class_teacher_remark}
                                onFocus={() => loadRemarks(s.id)}
                                onChange={(e) => setRemarksMap((p) => ({ ...p, [s.id]: { ...r, class_teacher_remark: e.target.value } }))}
                                onBlur={() => saveRemark(s.id)} placeholder="Teacher remark..." />
                            </TableCell>
                          )}
                          {canEditRemarks && (
                            <TableCell>
                              <Textarea rows={2} className="min-h-[60px]" value={r.principal_remark}
                                onFocus={() => loadRemarks(s.id)}
                                onChange={(e) => setRemarksMap((p) => ({ ...p, [s.id]: { ...r, principal_remark: e.target.value } }))}
                                onBlur={() => saveRemark(s.id)} placeholder="Principal remark..." />
                            </TableCell>
                          )}
                          <TableCell>
                            <Button size="sm" onClick={() => generatePDF(s)} disabled={generating === s.id}>
                              {generating === s.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />} PDF
                            </Button>
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
