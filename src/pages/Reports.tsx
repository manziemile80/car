import { PageHeader } from '@/components/layout/PageHeader';
import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { BehaviorCategory } from '@/types/database';
import { BarChart3, Loader2, TrendingUp, TrendingDown } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

const categoryLabels: Record<BehaviorCategory, string> = {
  discipline: 'Discipline',
  respect: 'Respect',
  attendance: 'Attendance',
  participation: 'Participation',
};

const COLORS = ['hsl(152, 60%, 40%)', 'hsl(174, 60%, 40%)', 'hsl(38, 92%, 50%)', 'hsl(200, 80%, 50%)'];

export default function Reports() {
  const { role } = useAuth();
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('month');
  const [categoryData, setCategoryData] = useState<{ name: string; average: number }[]>([]);
  const [trendData, setTrendData] = useState<{ date: string; score: number }[]>([]);
  const [distributionData, setDistributionData] = useState<{ name: string; value: number }[]>([]);
  const [stats, setStats] = useState({
    totalScores: 0,
    avgScore: 0,
    highestCategory: '',
    lowestCategory: '',
  });

  useEffect(() => {
    fetchReportData();
  }, [timeRange]);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      // Calculate date range
      const now = new Date();
      let startDate = new Date();
      if (timeRange === 'week') {
        startDate.setDate(now.getDate() - 7);
      } else if (timeRange === 'month') {
        startDate.setMonth(now.getMonth() - 1);
      } else {
        startDate.setFullYear(now.getFullYear() - 1);
      }

      // Fetch scores within range
      const { data: scores } = await supabase
        .from('behavior_scores')
        .select('*')
        .gte('score_date', startDate.toISOString().split('T')[0]);

      if (!scores || scores.length === 0) {
        setCategoryData([]);
        setTrendData([]);
        setDistributionData([]);
        setStats({ totalScores: 0, avgScore: 0, highestCategory: '-', lowestCategory: '-' });
        setLoading(false);
        return;
      }

      // Calculate category averages
      const categoryScores: Record<BehaviorCategory, number[]> = {
        discipline: [],
        respect: [],
        attendance: [],
        participation: [],
      };

      scores.forEach((s) => {
        categoryScores[s.category as BehaviorCategory].push(s.score);
      });

      const catData = Object.entries(categoryScores).map(([cat, arr]) => ({
        name: categoryLabels[cat as BehaviorCategory],
        average: arr.length > 0 ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0,
      }));
      setCategoryData(catData);

      // Calculate trend (group by date)
      const dateGroups: Record<string, number[]> = {};
      scores.forEach((s) => {
        const date = s.score_date;
        if (!dateGroups[date]) dateGroups[date] = [];
        dateGroups[date].push(s.score);
      });

      const trend = Object.entries(dateGroups)
        .map(([date, arr]) => ({
          date,
          score: Math.round(arr.reduce((a, b) => a + b, 0) / arr.length),
        }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(-14);
      setTrendData(trend);

      // Calculate distribution
      const distribution = [
        { name: 'Excellent (80-100)', value: scores.filter((s) => s.score >= 80).length },
        { name: 'Good (60-79)', value: scores.filter((s) => s.score >= 60 && s.score < 80).length },
        { name: 'Average (40-59)', value: scores.filter((s) => s.score >= 40 && s.score < 60).length },
        { name: 'Poor (0-39)', value: scores.filter((s) => s.score < 40).length },
      ];
      setDistributionData(distribution);

      // Calculate stats
      const totalAvg = Math.round(scores.reduce((a, s) => a + s.score, 0) / scores.length);
      const sortedCats = catData.sort((a, b) => b.average - a.average);
      setStats({
        totalScores: scores.length,
        avgScore: totalAvg,
        highestCategory: sortedCats[0]?.name || '-',
        lowestCategory: sortedCats[sortedCats.length - 1]?.name || '-',
      });
    } catch (error) {
      console.error('Error fetching report data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Reports</h1>
            <p className="mt-1 text-sm sm:text-base text-muted-foreground">
              Analyze behavior trends and performance metrics
            </p>
          </div>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Last 7 days</SelectItem>
              <SelectItem value="month">Last 30 days</SelectItem>
              <SelectItem value="year">Last year</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Scores</p>
                      <p className="text-3xl font-bold">{stats.totalScores}</p>
                    </div>
                    <BarChart3 className="h-8 w-8 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Average Score</p>
                      <p className="text-3xl font-bold">{stats.avgScore}</p>
                    </div>
                    {stats.avgScore >= 60 ? (
                      <TrendingUp className="h-8 w-8 text-success" />
                    ) : (
                      <TrendingDown className="h-8 w-8 text-destructive" />
                    )}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div>
                    <p className="text-sm text-muted-foreground">Best Category</p>
                    <p className="text-xl font-bold text-success">{stats.highestCategory}</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div>
                    <p className="text-sm text-muted-foreground">Needs Attention</p>
                    <p className="text-xl font-bold text-warning">{stats.lowestCategory}</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Charts */}
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Category Averages */}
              <Card>
                <CardHeader>
                  <CardTitle>Average Scores by Category</CardTitle>
                </CardHeader>
                <CardContent>
                  {categoryData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={categoryData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} domain={[0, 100]} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                          }}
                        />
                        <Bar dataKey="average" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                      No data available
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Score Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Score Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  {distributionData.some((d) => d.value > 0) ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={distributionData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {distributionData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                          }}
                        />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                      No data available
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Trend Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Score Trend Over Time</CardTitle>
              </CardHeader>
              <CardContent>
                {trendData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} domain={[0, 100]} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                      />
                      <Bar dataKey="score" fill="hsl(var(--secondary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                    No data available for this time range
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
