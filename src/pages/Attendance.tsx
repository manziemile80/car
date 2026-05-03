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
import { CalendarCheck, Loader2, Save, Search } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface Student { id: string; first_name: string; last_name: string; student_id: string; }
interface ClassRow { id: string; name: string; }
type Status = 'present' | 'absent' | 'late' | 'excused';

export default function Attendance() {
  const { user, role } = useAuth();
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [classId, setClassId] = useState<string>('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [statuses, setStatuses] = useState<Record<string, Status>>({});
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const canEdit = role === 'admin' || role === 'teacher';

  useEffect(() => {
    supabase.from('classes').select('id, name').order('name').then(({ data }) => setClasses(data || []));
  }, []);

  useEffect(() => {
    if (!classId) { setStudents([]); return; }
    supabase.from('students').select('id, first_name, last_name, student_id').eq('class_id', classId).order('last_name').then(({ data }) => setStudents(data || []));
  }, [classId]);

  useEffect(() => {
    if (!classId || !date) return;
    fetchAttendance();
  }, [classId, date]);

  const fetchAttendance = async () => {
    setLoading(true);
    const { data: studs } = await supabase.from('students').select('id').eq('class_id', classId);
    const ids = (studs || []).map((s) => s.id);
    if (ids.length === 0) { setStatuses({}); setLoading(false); return; }
    const { data } = await supabase.from('attendance').select('student_id, status').in('student_id', ids).eq('attendance_date', date);
    const map: Record<string, Status> = {};
    ids.forEach((id) => { map[id] = 'present'; });
    (data || []).forEach((r: any) => { map[r.student_id] = r.status; });
    setStatuses(map);
    setLoading(false);
  };

  const setStatus = (id: string, s: Status) => setStatuses((p) => ({ ...p, [id]: s }));

  const saveAll = async () => {
    if (!user) return;
    setSaving(true);
    const rows = Object.entries(statuses).map(([student_id, status]) => ({
      student_id, class_id: classId, attendance_date: date, status, recorded_by: user.id,
    }));
    const { error } = await supabase.from('attendance').upsert(rows, { onConflict: 'student_id,attendance_date' });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(`Attendance saved for ${rows.length} student(s)`);
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return students.filter((s) => `${s.first_name} ${s.last_name} ${s.student_id}`.toLowerCase().includes(q));
  }, [students, search]);

  const summary = useMemo(() => {
    const counts = { present: 0, absent: 0, late: 0, excused: 0 };
    Object.values(statuses).forEach((s) => counts[s]++);
    return counts;
  }, [statuses]);

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Attendance</h1>
          <p className="mt-1 text-sm text-muted-foreground">Record daily attendance for your class</p>
        </div>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><CalendarCheck className="h-5 w-5" /> Select Class & Date</CardTitle></CardHeader>
          <CardContent>
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-2">
                <Label>Class</Label>
                <Select value={classId} onValueChange={setClassId}>
                  <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                  <SelectContent>{classes.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Date</Label>
                <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              </div>
            </div>
          </CardContent>
        </Card>

        {classId && (
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <CardTitle className="text-lg">Roll Call</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    📅 Attendance taken on{' '}
                    <span className="font-semibold text-foreground">
                      {format(new Date(date), 'EEEE, MMMM d, yyyy')}
                    </span>
                  </p>
                </div>
                <div className="flex gap-2 flex-wrap items-center">
                  <span className="text-sm text-muted-foreground">P:{summary.present} A:{summary.absent} L:{summary.late} E:{summary.excused}</span>
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search..." className="pl-8 w-48" />
                  </div>
                  {canEdit && <Button onClick={saveAll} disabled={saving}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save</Button>}
                </div>
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
                    <TableRow><TableHead>Student</TableHead><TableHead>ID</TableHead><TableHead className="w-44">Status</TableHead></TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((s) => (
                      <TableRow key={s.id}>
                        <TableCell className="font-medium">{s.first_name} {s.last_name}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{s.student_id}</TableCell>
                        <TableCell>
                          <Select value={statuses[s.id] || 'present'} onValueChange={(v) => setStatus(s.id, v as Status)} disabled={!canEdit}>
                            <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="present">Present</SelectItem>
                              <SelectItem value="absent">Absent</SelectItem>
                              <SelectItem value="late">Late</SelectItem>
                              <SelectItem value="excused">Excused</SelectItem>
                            </SelectContent>
                          </Select>
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
