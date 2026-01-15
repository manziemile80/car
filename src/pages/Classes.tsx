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
import { Plus, Search, BookOpen, Loader2, Users } from 'lucide-react';
import { toast } from 'sonner';

export default function Classes() {
  const { user } = useAuth();
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

  const filteredClasses = classes.filter((cls) =>
    cls.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cls.grade_level.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Classes</h1>
            <p className="mt-1 text-muted-foreground">
              Manage class sections and assignments
            </p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4" />
                Add Class
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
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

        {/* Search */}
        <div className="relative max-w-sm">
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
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
