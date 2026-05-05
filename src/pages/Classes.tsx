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
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Class } from '@/types/database';
import { Plus, Search, BookOpen, Loader2, Users, Trash2, Pencil, ArrowUpRight } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

export default function Classes() {
  const { user, role } = useAuth();
  const canManage = role === 'admin' || role === 'teacher';
  const [classes, setClasses] = useState<Class[]>([]);
  const [studentCounts, setStudentCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  
  // Form state
  const [name, setName] = useState('');
  const [gradeLevel, setGradeLevel] = useState('');
  const [academicYear, setAcademicYear] = useState(new Date().getFullYear().toString());

  // Edit
  const [editing, setEditing] = useState<Class | null>(null);
  const [editName, setEditName] = useState('');
  const [editGrade, setEditGrade] = useState('');
  const [editYear, setEditYear] = useState('');

  // Promote
  const [promoteOpen, setPromoteOpen] = useState(false);
  const [fromClass, setFromClass] = useState<string>('');
  const [toClass, setToClass] = useState<string>('');
  const [promoting, setPromoting] = useState(false);
  const [eligibleCount, setEligibleCount] = useState<number>(0);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: classesData } = await supabase
        .from('classes')
        .select('*')
        .order('name');

      if (classesData) {
        setClasses(classesData as Class[]);
        
        // Fetch student counts for each class
        const counts: Record<string, number> = {};
        for (const cls of classesData) {
          const { count } = await supabase
            .from('students')
            .select('*', { count: 'exact', head: true })
            .eq('class_id', cls.id);
          counts[cls.id] = count || 0;
        }
        setStudentCounts(counts);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load classes');
    } finally {
      setLoading(false);
    }
  };

  const handleAddClass = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);

    try {
      const { error } = await supabase.from('classes').insert({
        name,
        grade_level: gradeLevel,
        academic_year: academicYear,
        teacher_id: user?.id || null,
      });

      if (error) throw error;

      toast.success('Class created successfully');
      setIsAddDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error: any) {
      toast.error('Failed to create class', { description: error.message });
    } finally {
      setFormLoading(false);
    }
  };

  const resetForm = () => {
    setName('');
    setGradeLevel('');
    setAcademicYear(new Date().getFullYear().toString());
  };

  const handleDeleteClass = async (cls: Class) => {
    if (!confirm(`Delete class "${cls.name}"? Students linked to it will be unassigned.`)) return;
    const { error } = await supabase.from('classes').delete().eq('id', cls.id);
    if (error) return toast.error('Failed to delete', { description: error.message });
    toast.success('Class deleted');
    fetchData();
  };

  const openEdit = (cls: Class) => {
    setEditing(cls);
    setEditName(cls.name);
    setEditGrade(cls.grade_level);
    setEditYear(cls.academic_year);
  };

  const handleEditSave = async () => {
    if (!editing) return;
    const { error } = await supabase
      .from('classes')
      .update({ name: editName, grade_level: editGrade, academic_year: editYear })
      .eq('id', editing.id);
    if (error) return toast.error('Failed to update', { description: error.message });
    toast.success('Class updated');
    setEditing(null);
    fetchData();
  };

  // Recompute eligible students count when class selection changes
  useEffect(() => {
    if (!fromClass) { setEligibleCount(0); return; }
    setEligibleCount(studentCounts[fromClass] || 0);
  }, [fromClass, studentCounts]);

  const handlePromote = async () => {
    if (!fromClass || !toClass || fromClass === toClass) {
      return toast.error('Select different source and destination classes');
    }
    if (!confirm(`Promote ALL ${eligibleCount} student(s) from this class to the new class?`)) return;
    setPromoting(true);
    const { error, count } = await supabase
      .from('students')
      .update({ class_id: toClass }, { count: 'exact' })
      .eq('class_id', fromClass);
    setPromoting(false);
    if (error) return toast.error('Promotion failed', { description: error.message });
    toast.success(`Promoted ${count ?? eligibleCount} student(s)`);
    setPromoteOpen(false);
    setFromClass(''); setToClass('');
    fetchData();
  };

  const filteredClasses = classes.filter((cls) =>
    cls.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cls.grade_level.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Classes</h1>
            <p className="mt-1 text-sm sm:text-base text-muted-foreground">
              Manage class sections and assignments
            </p>
          </div>
          {canManage && (
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Dialog open={promoteOpen} onOpenChange={setPromoteOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="secondary" className="w-full sm:w-auto">
                <ArrowUpRight className="h-4 w-4" />
                Promote Students
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md w-[calc(100%-1rem)]">
              <DialogHeader>
                <DialogTitle>Promote Students to Next Class</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-2">
                <div className="space-y-2">
                  <Label>From Class</Label>
                  <Select value={fromClass} onValueChange={setFromClass}>
                    <SelectTrigger><SelectValue placeholder="Select source class (e.g., S1)" /></SelectTrigger>
                    <SelectContent>
                      {classes.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.name} ({studentCounts[c.id] || 0} students)</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>To Class</Label>
                  <Select value={toClass} onValueChange={setToClass}>
                    <SelectTrigger><SelectValue placeholder="Select destination class (e.g., S2)" /></SelectTrigger>
                    <SelectContent>
                      {classes.filter(c => c.id !== fromClass).map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="rounded-md bg-muted/60 p-3 text-sm">
                  <strong>{eligibleCount}</strong> eligible student(s) will be moved.
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setPromoteOpen(false)}>Cancel</Button>
                  <Button onClick={handlePromote} disabled={promoting || !fromClass || !toClass}>
                    {promoting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUpRight className="h-4 w-4" />}
                    Promote
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="w-full sm:w-auto">
                <Plus className="h-4 w-4" />
                Add Class
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto w-[calc(100%-1rem)]">
              <DialogHeader>
                <DialogTitle>Create New Class</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddClass} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Class Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Class 5A"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gradeLevel">Grade Level</Label>
                  <Input
                    id="gradeLevel"
                    value={gradeLevel}
                    onChange={(e) => setGradeLevel(e.target.value)}
                    placeholder="e.g., Grade 5"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="academicYear">Academic Year</Label>
                  <Input
                    id="academicYear"
                    value={academicYear}
                    onChange={(e) => setAcademicYear(e.target.value)}
                    placeholder="e.g., 2024-2025"
                    required
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
                        Creating...
                      </>
                    ) : (
                      'Create Class'
                    )}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
          </div>
          )}
        </div>

        {/* Search */}
        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search classes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Classes Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredClasses.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold text-foreground">No classes found</h3>
              <p className="text-muted-foreground">
                {searchQuery ? 'Try adjusting your search' : 'Create your first class to get started'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {filteredClasses.map((cls) => (
              <Card key={cls.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
                      <BookOpen className="h-6 w-6" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{cls.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">{cls.grade_level}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between pt-2 border-t border-border">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span className="text-sm">{studentCounts[cls.id] || 0} students</span>
                    </div>
                    <span className="text-sm text-muted-foreground">{cls.academic_year}</span>
                  </div>
                  {canManage && (
                    <div className="flex gap-2 mt-3">
                      <Button variant="outline" size="sm" className="flex-1" onClick={() => openEdit(cls)}>
                        <Pencil className="h-4 w-4" /> Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="flex-1 text-destructive hover:text-destructive"
                        onClick={() => handleDeleteClass(cls)}
                      >
                        <Trash2 className="h-4 w-4" /> Delete
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Edit dialog */}
        <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
          <DialogContent className="sm:max-w-md w-[calc(100%-1rem)]">
            <DialogHeader><DialogTitle>Edit Class</DialogTitle></DialogHeader>
            <div className="space-y-3 mt-2">
              <div className="space-y-2">
                <Label>Class Name</Label>
                <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Grade Level</Label>
                <Input value={editGrade} onChange={(e) => setEditGrade(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Academic Year</Label>
                <Input value={editYear} onChange={(e) => setEditYear(e.target.value)} />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
                <Button onClick={handleEditSave}>Save</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
