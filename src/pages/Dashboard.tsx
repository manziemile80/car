import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { RecentScoresTable } from '@/components/dashboard/RecentScoresTable';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { BehaviorScoreWithDetails } from '@/types/database';
import {
  GraduationCap,
  Users,
  ClipboardList,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function Dashboard() {
  const { role, profile } = useAuth();
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalClasses: 0,
    totalScores: 0,
    averageScore: 0,
  });
  const [recentScores, setRecentScores] = useState<BehaviorScoreWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, [role]);

  const fetchDashboardData = async () => {
    try {
      // Fetch students count
      const { count: studentsCount } = await supabase
        .from('students')
        .select('*', { count: 'exact', head: true });

      // Fetch classes count
      const { count: classesCount } = await supabase
        .from('classes')
        .select('*', { count: 'exact', head: true });

      // Fetch behavior scores with details
      const { data: scoresData, count: scoresCount } = await supabase
        .from('behavior_scores')
        .select(`
          *,
          student:students(*, class:classes(*)),
          teacher:profiles!behavior_scores_teacher_id_fkey(*)
        `, { count: 'exact' })
        .order('created_at', { ascending: false })
        .limit(10);

      // Calculate average score
      const { data: avgData } = await supabase
        .from('behavior_scores')
        .select('score');

      const avgScore = avgData && avgData.length > 0
        ? Math.round(avgData.reduce((sum, s) => sum + s.score, 0) / avgData.length)
        : 0;

      setStats({
        totalStudents: studentsCount || 0,
        totalClasses: classesCount || 0,
        totalScores: scoresCount || 0,
        averageScore: avgScore,
      });

      setRecentScores((scoresData as unknown as BehaviorScoreWithDetails[]) || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const roleLabels = {
    admin: 'Administrator',
    teacher: 'Teacher',
    parent: 'Parent',
  };

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-fade-in">
        {/* Header */}
        <div className="space-y-2">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-secondary">Dashboard</p>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            {getGreeting()}, {profile?.full_name?.split(' ')[0] || 'there'}
          </h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Your school at a glance — students, conduct records, academics and e-learning activity.
          </p>
        </div>

        {/* Stats Grid */}
        {(role === 'admin' || role === 'teacher') && (
          <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Total Students"
              value={stats.totalStudents}
              icon={GraduationCap}
              variant="primary"
            />
            <StatCard
              title="Total Classes"
              value={stats.totalClasses}
              icon={Users}
              variant="secondary"
            />
            <StatCard
              title="Behavior Scores"
              value={stats.totalScores}
              subtitle="All time"
              icon={ClipboardList}
            />
            <StatCard
              title="Average Score"
              value={stats.averageScore}
              subtitle={stats.averageScore >= 70 ? 'Good standing' : 'Needs attention'}
              icon={stats.averageScore >= 70 ? CheckCircle : AlertTriangle}
              variant={stats.averageScore >= 70 ? 'success' : 'warning'}
            />
          </div>
        )}

        {/* Recent Scores */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-muted-foreground" />
              Recent Behavior Scores
            </CardTitle>
          </CardHeader>
          <CardContent>
            <RecentScoresTable scores={recentScores} loading={loading} />
          </CardContent>
        </Card>

        {/* Quick Actions for Admin/Teacher */}
        {(role === 'admin' || role === 'teacher') && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Link to="/scores?action=new">
              <Card className="border-dashed border-2 hover:border-primary/50 hover:bg-muted/50 transition-all cursor-pointer h-full">
                <CardContent className="flex flex-col items-center justify-center py-8">
                  <ClipboardList className="h-10 w-10 text-muted-foreground mb-3" />
                  <h3 className="font-semibold text-foreground">Record Score</h3>
                  <p className="text-sm text-muted-foreground text-center mt-1">
                    Add a new behavior score for a student
                  </p>
                </CardContent>
              </Card>
            </Link>
            <Link to="/students?action=new">
              <Card className="border-dashed border-2 hover:border-primary/50 hover:bg-muted/50 transition-all cursor-pointer h-full">
                <CardContent className="flex flex-col items-center justify-center py-8">
                  <GraduationCap className="h-10 w-10 text-muted-foreground mb-3" />
                  <h3 className="font-semibold text-foreground">Add Student</h3>
                  <p className="text-sm text-muted-foreground text-center mt-1">
                    Register a new student in the system
                  </p>
                </CardContent>
              </Card>
            </Link>
            <Link to="/reports">
              <Card className="border-dashed border-2 hover:border-primary/50 hover:bg-muted/50 transition-all cursor-pointer h-full">
                <CardContent className="flex flex-col items-center justify-center py-8">
                  <TrendingUp className="h-10 w-10 text-muted-foreground mb-3" />
                  <h3 className="font-semibold text-foreground">View Reports</h3>
                  <p className="text-sm text-muted-foreground text-center mt-1">
                    Generate and view behavior reports
                  </p>
                </CardContent>
              </Card>
            </Link>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
