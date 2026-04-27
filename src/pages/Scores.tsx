import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
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
import { useAuth } from '@/contexts/AuthContext';
import { Student, Class, BehaviorCategory, BehaviorScoreWithDetails } from '@/types/database';
import { Plus, Search, ClipboardList, Loader2, Bell, Send, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ScoreBadge } from '@/components/dashboard/ScoreBadge';
import { ScoreDetailsDialog } from '@/components/scores/ScoreDetailsDialog';
interface StudentWithClass extends Student {
  class?: Class | null;
}

const categoryLabels: Record<BehaviorCategory, string> = {
  discipline: 'Discipline',
  respect: 'Respect',
  attendance: 'Attendance',
  participation: 'Participation',
};

const categories: BehaviorCategory[] = ['discipline', 'respect', 'attendance', 'participation'];

export default function Scores() {
  const { user } = useAuth();
  const [scores, setScores] = useState<BehaviorScoreWithDetails[]>([]);
  const [students, setStudents] = useState<StudentWithClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [testSmsLoading, setTestSmsLoading] = useState(false);
  const [selectedScore, setSelectedScore] = useState<BehaviorScoreWithDetails | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  
  // Form state
  const [selectedStudent, setSelectedStudent] = useState('');
  const [category, setCategory] = useState<BehaviorCategory>('discipline');
  const [score, setScore] = useState([75]);
  const [notes, setNotes] = useState('');
  const [scoreDate, setScoreDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [scoresRes, studentsRes] = await Promise.all([
        supabase
          .from('behavior_scores')
          .select('*, student:students(*, class:classes(*)), teacher:profiles(*)') 
          .order('created_at', { ascending: false }),
        supabase.from('students').select('*, class:classes(*)').order('last_name'),
      ]);

      if (scoresRes.data) {
        setScores(scoresRes.data as unknown as BehaviorScoreWithDetails[]);
      }
      if (studentsRes.data) {
        setStudents(studentsRes.data as StudentWithClass[]);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load scores');
    } finally {
      setLoading(false);
    }
  };

  const handleAddScore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setFormLoading(true);

    try {
      const { data: scoreData, error } = await supabase.from('behavior_scores').insert({
        student_id: selectedStudent,
        teacher_id: user.id,
        category,
        score: score[0],
        notes: notes || null,
        score_date: scoreDate,
      }).select().single();

      if (error) throw error;

      // Send SMS notification
      if (scoreData) {
        try {
          await sendSmsNotification(scoreData.id, selectedStudent, score[0], scoreDate);
        } catch (smsError) {
          console.error('SMS notification failed:', smsError);
          // Don't fail the whole operation if SMS fails
        }
      }

      toast.success('Behavior score recorded', {
        description: 'Parents will be notified via SMS',
      });
      setIsAddDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error: any) {
      toast.error('Failed to record score', { description: error.message });
    } finally {
      setFormLoading(false);
    }
  };

  const sendSmsNotification = async (scoreId: string, studentId: string, scoreValue: number, date: string) => {
    // Call the edge function to send SMS and update notification records
    const response = await supabase.functions.invoke('send-sms-notification', {
      body: {
        behaviorScoreId: scoreId,
        studentId: studentId,
        score: scoreValue,
        date: date,
      },
    });

    if (response.error) {
      throw new Error(response.error.message);
    }

    console.log('SMS notification response:', response.data);
  };

  const resetForm = () => {
    setSelectedStudent('');
    setCategory('discipline');
    setScore([75]);
    setNotes('');
    setScoreDate(format(new Date(), 'yyyy-MM-dd'));
  };

  const handleTestSms = async () => {
    setTestSmsLoading(true);
    try {
      // Use Eric NIGABA who has a linked parent
      const testStudentId = '688cb156-6dfb-477a-92da-c5fc763d671d';
      const testScore = 85;
      const testDate = format(new Date(), 'yyyy-MM-dd');

      // Call the edge function directly for testing
      const response = await supabase.functions.invoke('send-sms-notification', {
        body: {
          behaviorScoreId: 'test-' + Date.now(),
          studentId: testStudentId,
          score: testScore,
          date: testDate,
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      console.log('Test SMS response:', response.data);
      
      if (response.data?.success) {
        toast.success('Test SMS sent successfully!', {
          description: `Sent to ${response.data.results?.length || 0} parent(s)`,
        });
      } else {
        toast.warning('SMS test completed', {
          description: response.data?.message || 'Check console for details',
        });
      }
    } catch (error: any) {
      console.error('Test SMS error:', error);
      toast.error('Test SMS failed', { description: error.message });
    } finally {
      setTestSmsLoading(false);
    }
  };

  const filteredScores = scores.filter((s) => {
    if (!s.student) return false;
    const fullName = `${s.student.first_name} ${s.student.last_name}`.toLowerCase();
    return fullName.includes(searchQuery.toLowerCase());
  });

  const getScoreColor = (value: number) => {
    if (value >= 80) return 'text-success';
    if (value >= 60) return 'text-secondary';
    if (value >= 40) return 'text-warning';
    return 'text-destructive';
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Behavior Scores</h1>
            <p className="mt-1 text-sm sm:text-base text-muted-foreground">
              Record and manage student behavior assessments
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={handleTestSms} disabled={testSmsLoading}>
              {testSmsLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Test SMS
            </Button>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4" />
                  Record Score
                </Button>
              </DialogTrigger>
            <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto p-4 sm:p-6 w-[calc(100%-1rem)]">
              <DialogHeader>
                <DialogTitle>Record Behavior Score</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddScore} className="space-y-3 mt-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="student" className="text-sm">Student</Label>
                    <Select value={selectedStudent} onValueChange={setSelectedStudent} required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a student" />
                      </SelectTrigger>
                      <SelectContent>
                        {students.map((student) => (
                          <SelectItem key={student.id} value={student.id}>
                            {student.first_name} {student.last_name} - {student.class?.name || 'No class'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="category" className="text-sm">Category</Label>
                    <Select value={category} onValueChange={(v) => setCategory(v as BehaviorCategory)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {categoryLabels[cat]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Score</Label>
                    <span className={`text-lg font-bold ${getScoreColor(score[0])}`}>
                      {score[0]}
                    </span>
                  </div>
                  <Slider
                    value={score}
                    onValueChange={setScore}
                    max={100}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>0 - Poor</span>
                    <span>50 - Average</span>
                    <span>100 - Excellent</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="date" className="text-sm">Date</Label>
                    <Input
                      id="date"
                      type="date"
                      value={scoreDate}
                      onChange={(e) => setScoreDate(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="notes" className="text-sm">Notes (Optional)</Label>
                    <Textarea
                      id="notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Add notes..."
                      rows={2}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 rounded-lg bg-info/10 p-2 text-xs text-info">
                  <Bell className="h-3.5 w-3.5" />
                  <span>Parents will be notified via SMS</span>
                </div>

                <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-1">
                  <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)} className="w-full sm:w-auto">
                    Cancel
                  </Button>
                  <Button type="submit" disabled={formLoading || !selectedStudent} className="w-full sm:w-auto">
                    {formLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Recording...
                      </>
                    ) : (
                      'Record Score'
                    )}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
          </div>
        </div>

        {/* Search */}
        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by student name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Scores List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredScores.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <ClipboardList className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold text-foreground">No scores found</h3>
              <p className="text-muted-foreground">
                {searchQuery ? 'Try adjusting your search' : 'Record your first behavior score to get started'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border bg-card">
            <table className="w-full min-w-[640px]">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-3 text-left text-sm font-semibold text-muted-foreground">
                    Student
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-muted-foreground">
                    Category
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-muted-foreground">
                    Score
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-muted-foreground">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-muted-foreground">
                    Teacher
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-muted-foreground">
                    Details
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredScores.map((score) => (
                  <tr key={score.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-4">
                      <div>
                        <p className="font-medium text-foreground">
                          {score.student?.first_name} {score.student?.last_name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {score.student?.class?.name || 'No class'}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="rounded-md bg-muted px-2 py-1 text-sm font-medium text-foreground">
                        {categoryLabels[score.category]}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <ScoreBadge score={score.score} />
                    </td>
                    <td className="px-4 py-4 text-sm text-muted-foreground">
                      {format(new Date(score.score_date), 'MMM d, yyyy')}
                    </td>
                    <td className="px-4 py-4 text-sm text-muted-foreground">
                      {score.teacher?.full_name || 'Unknown'}
                    </td>
                    <td className="px-4 py-4 text-center">
                      <button
                        onClick={() => {
                          setSelectedScore(score);
                          setDetailsDialogOpen(true);
                        }}
                        className="inline-flex items-center justify-center rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Score Details Dialog */}
        <ScoreDetailsDialog
          score={selectedScore}
          open={detailsDialogOpen}
          onOpenChange={setDetailsDialogOpen}
        />
      </div>
    </DashboardLayout>
  );
}
