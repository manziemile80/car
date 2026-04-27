import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { Student, Class, Parent, StudentParent } from '@/types/database';
import { Plus, Search, GraduationCap, Loader2, Users } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { LinkParentsDialog } from '@/components/students/LinkParentsDialog';

interface LinkedParent extends StudentParent {
  parent?: Parent;
}

interface StudentWithClass extends Student {
  class?: Class | null;
  student_parents?: LinkedParent[];
}

export default function Students() {
  const [students, setStudents] = useState<StudentWithClass[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  
  // Link parents dialog state
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<StudentWithClass | null>(null);
  
  // Form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [classId, setClassId] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [studentsRes, classesRes] = await Promise.all([
        supabase
          .from('students')
          .select('*, class:classes(*), student_parents(*, parent:parents(*))')
          .order('last_name'),
        supabase.from('classes').select('*').order('name'),
      ]);

      if (studentsRes.data) {
        setStudents(studentsRes.data as StudentWithClass[]);
      }
      if (classesRes.data) {
        setClasses(classesRes.data as Class[]);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenLinkDialog = (student: StudentWithClass) => {
    setSelectedStudent(student);
    setLinkDialogOpen(true);
  };

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);

    try {
      const { error } = await supabase.from('students').insert({
        first_name: firstName,
        last_name: lastName,
        student_id: studentId,
        class_id: classId || null,
        date_of_birth: dateOfBirth || null,
      });

      if (error) throw error;

      toast.success('Student added successfully');
      setIsAddDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error: any) {
      toast.error('Failed to add student', { description: error.message });
    } finally {
      setFormLoading(false);
    }
  };

  const resetForm = () => {
    setFirstName('');
    setLastName('');
    setStudentId('');
    setClassId('');
    setDateOfBirth('');
  };

  const filteredStudents = students.filter((student) => {
    const fullName = `${student.first_name} ${student.last_name}`.toLowerCase();
    return (
      fullName.includes(searchQuery.toLowerCase()) ||
      student.student_id.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Students</h1>
            <p className="mt-1 text-sm sm:text-base text-muted-foreground">
              Manage student records and information
            </p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="w-full sm:w-auto">
                <Plus className="h-4 w-4" />
                Add Student
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto w-[calc(100%-1rem)]">
              <DialogHeader>
                <DialogTitle>Add New Student</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddStudent} className="space-y-4 mt-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="studentId">Student ID</Label>
                  <Input
                    id="studentId"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    placeholder="e.g., STU-2024-001"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="class">Class</Label>
                  <Select value={classId} onValueChange={setClassId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a class" />
                    </SelectTrigger>
                    <SelectContent>
                      {classes.map((cls) => (
                        <SelectItem key={cls.id} value={cls.id}>
                          {cls.name} - {cls.grade_level}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dateOfBirth">Date of Birth</Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                  />
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={formLoading}>
                    {formLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      'Add Student'
                    )}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search */}
        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search students..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Students Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredStudents.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <GraduationCap className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold text-foreground">No students found</h3>
              <p className="text-muted-foreground">
                {searchQuery ? 'Try adjusting your search' : 'Add your first student to get started'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {filteredStudents.map((student) => (
              <Card key={student.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-medium">
                        {student.first_name.charAt(0)}
                        {student.last_name.charAt(0)}
                      </div>
                      <div>
                        <CardTitle className="text-base">
                          {student.first_name} {student.last_name}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">{student.student_id}</p>
                      </div>
                    </div>
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-medium ${
                        student.status === 'active'
                          ? 'bg-success/15 text-success'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {student.status}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Class</span>
                      <span className="font-medium">{student.class?.name || 'Not assigned'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Grade</span>
                      <span className="font-medium">{student.class?.grade_level || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Enrolled</span>
                      <span className="font-medium">
                        {format(new Date(student.enrollment_date), 'MMM d, yyyy')}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Parents</span>
                      <span className="font-medium">
                        {student.student_parents?.length || 0} linked
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-4"
                    onClick={() => handleOpenLinkDialog(student)}
                  >
                    <Users className="h-4 w-4" />
                    Link Parents
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Link Parents Dialog */}
        {selectedStudent && (
          <LinkParentsDialog
            studentId={selectedStudent.id}
            studentName={`${selectedStudent.first_name} ${selectedStudent.last_name}`}
            open={linkDialogOpen}
            onOpenChange={setLinkDialogOpen}
            onUpdate={fetchData}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
