import React, { useState, useEffect } from 'react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, Cell, RadarChart, Radar, PolarAngleAxis,
  PolarRadiusAxis
} from 'recharts';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  GetSessionStatistics,
  GetActivityTrends,
  GetProgressMetrics,
  GetChildComparisonStats,
  GetMonthlyReportData,
  GetAllChildren,
} from '@/wailsjs/go/main/App';
import { useMemo } from 'react';

interface Child {
  ID: number;
  Name: string;
  Gender: string;
}

interface ChartDataPoint {
  name: string;
  value?: number;
  count?: number;
  total_minutes?: number;
  average_minutes?: number;
  [key: string]: any;
}

const AnalyticsDashboard: React.FC = () => {
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<number | null>(null);
  const [sessionStats, setSessionStats] = useState<any>(null);
  const [activityTrends, setActivityTrends] = useState<any>(null);
  const [progressMetrics, setProgressMetrics] = useState<any>(null);
  const [comparisonStats, setComparisonStats] = useState<any>(null);
  const [monthlyReport, setMonthlyReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date());

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  // Load children on mount
  useEffect(() => {
    const loadChildren = async () => {
      try {
        const childrenData = await GetAllChildren();
        setChildren(childrenData);
        if (childrenData && childrenData.length > 0) {
          setSelectedChildId(childrenData[0].ID);
        }
      } catch (error) {
        console.error('Error loading children:', error);
      }
    };

    loadChildren();
  }, []);

  // Load analytics data when child is selected
  useEffect(() => {
    if (selectedChildId === null) return;

    const loadAnalyticsData = async () => {
      setLoading(true);
      try {
        const [stats, trends, metrics] = await Promise.all([
          GetSessionStatistics(selectedChildId, 6),
          GetActivityTrends(selectedChildId, 6),
          GetProgressMetrics(selectedChildId),
        ]);

        setSessionStats(stats);
        setActivityTrends(trends);
        setProgressMetrics(metrics);

        // Load monthly report
        const year = selectedMonth.getFullYear();
        const month = selectedMonth.getMonth() + 1;
        const monthlyData = await GetMonthlyReportData(selectedChildId, year, month);
        setMonthlyReport(monthlyData);
      } catch (error) {
        console.error('Error loading analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAnalyticsData();
  }, [selectedChildId, selectedMonth]);

  // Load comparison stats
  useEffect(() => {
    const loadComparison = async () => {
      try {
        const comparison = await GetChildComparisonStats();
        setComparisonStats(comparison);
      } catch (error) {
        console.error('Error loading comparison stats:', error);
      }
    };

    loadComparison();
  }, []);

  // Prepare chart data from session stats
  const sessionChartData = useMemo(() => {
    if (!sessionStats || !sessionStats.sessions_by_month) return [];
    return Object.entries(sessionStats.sessions_by_month).map(([month, count]) => ({
      month,
      sessions: count,
      duration: sessionStats.duration_by_month?.[month] || 0,
    }));
  }, [sessionStats]);

  // Prepare activity trends data
  const activityChartData = useMemo(() => {
    if (!activityTrends || !activityTrends.activities) return [];
    return activityTrends.activities.map((a: any) => ({
      name: a.name,
      value: a.count,
      duration: a.total_minutes,
    }));
  }, [activityTrends]);

  // Prepare comparison data
  const comparisonChartData = useMemo(() => {
    if (!comparisonStats || !comparisonStats.children_statistics) return [];
    return comparisonStats.children_statistics.map((child: any) => ({
      name: child.child_name,
      sessions: child.sessions,
      goals: child.goals,
      rewards: child.rewards,
    }));
  }, [comparisonStats]);

  if (loading && !sessionStats) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-500">Memuat data analytics...</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics & Insights</h1>
          <p className="text-gray-600">Analisis perkembangan terapi dan tren aktivitas</p>
        </div>

        {/* Child Selection */}
        <Card className="mb-8 p-6 shadow-lg">
          <label className="block text-sm font-medium text-gray-700 mb-4">
            Pilih Anak
          </label>
          <div className="flex gap-2 flex-wrap">
            {children.map((child) => (
              <Button
                key={child.ID}
                onClick={() => setSelectedChildId(child.ID)}
                variant={selectedChildId === child.ID ? 'default' : 'outline'}
                className="transition-all"
              >
                {child.Name}
              </Button>
            ))}
          </div>
        </Card>

        {selectedChildId && (
          <>
            {/* Key Metrics */}
            {progressMetrics && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <Card className="p-6 bg-white shadow">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Total Sesi</h3>
                  <p className="text-3xl font-bold text-blue-600">{progressMetrics.total_sessions}</p>
                </Card>
                <Card className="p-6 bg-white shadow">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Tujuan Tercapai</h3>
                  <p className="text-3xl font-bold text-green-600">
                    {progressMetrics.achieved_goals}/{progressMetrics.total_goals}
                  </p>
                </Card>
                <Card className="p-6 bg-white shadow">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Total Reward</h3>
                  <p className="text-3xl font-bold text-amber-600">{progressMetrics.total_rewards}</p>
                </Card>
                <Card className="p-6 bg-white shadow">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Tingkat Pencapaian</h3>
                  <p className="text-3xl font-bold text-purple-600">
                    {progressMetrics.completion_rate?.toFixed(1)}%
                  </p>
                </Card>
              </div>
            )}

            {/* Charts Tabs */}
            <Tabs defaultValue="sessions" className="space-y-6">
              <TabsList className="grid w-full grid-cols-4 bg-white shadow">
                <TabsTrigger value="sessions">Sesi</TabsTrigger>
                <TabsTrigger value="activities">Aktivitas</TabsTrigger>
                <TabsTrigger value="monthly">Bulanan</TabsTrigger>
                <TabsTrigger value="comparison">Perbandingan</TabsTrigger>
              </TabsList>

              {/* Session Statistics */}
              <TabsContent value="sessions" className="space-y-6">
                <Card className="p-6 shadow-lg">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Tren Sesi (6 Bulan Terakhir)</h2>
                  {sessionChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={sessionChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="month" stroke="#6b7280" />
                        <YAxis stroke="#6b7280" />
                        <Tooltip 
                          contentStyle={{
                            backgroundColor: '#fff',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px'
                          }}
                        />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="sessions" 
                          stroke="#3b82f6" 
                          strokeWidth={2}
                          dot={{ fill: '#3b82f6', r: 4 }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="duration" 
                          stroke="#10b981" 
                          strokeWidth={2}
                          dot={{ fill: '#10b981', r: 4 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-gray-500 text-center py-8">Belum ada data sesi</p>
                  )}
                </Card>

                <Card className="p-6 shadow-lg">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Statistik Sesi</h2>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Total Sesi</p>
                      <p className="text-2xl font-bold text-blue-600">{sessionStats?.total_sessions || 0}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Sesi Selesai</p>
                      <p className="text-2xl font-bold text-green-600">{sessionStats?.completed_sessions || 0}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Rata-rata Durasi</p>
                      <p className="text-2xl font-bold text-amber-600">
                        {sessionStats?.average_duration?.toFixed(0) || 0} menit
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Total Durasi</p>
                      <p className="text-2xl font-bold text-purple-600">
                        {sessionStats?.total_duration || 0} menit
                      </p>
                    </div>
                  </div>
                </Card>
              </TabsContent>

              {/* Activity Trends */}
              <TabsContent value="activities" className="space-y-6">
                <Card className="p-6 shadow-lg">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Tren Aktivitas</h2>
                  {activityChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={activityChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="name" stroke="#6b7280" angle={-45} textAnchor="end" height={80} />
                        <YAxis stroke="#6b7280" />
                        <Tooltip 
                          contentStyle={{
                            backgroundColor: '#fff',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px'
                          }}
                        />
                        <Bar dataKey="value" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-gray-500 text-center py-8">Belum ada data aktivitas</p>
                  )}
                </Card>

                <Card className="p-6 shadow-lg">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Aktivitas Paling Sering</h2>
                  {activityChartData.length > 0 ? (
                    <div className="space-y-3">
                      {activityChartData.slice(0, 5).map((activity, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <span className="text-gray-700 font-medium">{activity.name}</span>
                          <div className="flex gap-4">
                            <span className="text-blue-600 font-semibold">{activity.value}x</span>
                            <span className="text-gray-500">{activity.duration} menit</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">Belum ada data aktivitas</p>
                  )}
                </Card>
              </TabsContent>

              {/* Monthly Report */}
              <TabsContent value="monthly" className="space-y-6">
                <Card className="p-6 shadow-lg">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-semibold text-gray-900">Laporan Bulanan</h2>
                    <input
                      type="month"
                      value={selectedMonth.toISOString().slice(0, 7)}
                      onChange={(e) => setSelectedMonth(new Date(e.target.value))}
                      className="px-4 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>

                  {monthlyReport && (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-600">Total Sesi</p>
                        <p className="text-2xl font-bold text-blue-600">{monthlyReport.total_sessions}</p>
                      </div>
                      <div className="bg-green-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-600">Sesi Selesai</p>
                        <p className="text-2xl font-bold text-green-600">{monthlyReport.completed_sessions}</p>
                      </div>
                      <div className="bg-amber-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-600">Total Menit</p>
                        <p className="text-2xl font-bold text-amber-600">{monthlyReport.total_session_minutes}</p>
                      </div>
                      <div className="bg-purple-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-600">Tujuan Buat</p>
                        <p className="text-2xl font-bold text-purple-600">{monthlyReport.goals}</p>
                      </div>
                      <div className="bg-pink-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-600">Tujuan Tercapai</p>
                        <p className="text-2xl font-bold text-pink-600">{monthlyReport.completed_goals}</p>
                      </div>
                      <div className="bg-indigo-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-600">Reward Diberikan</p>
                        <p className="text-2xl font-bold text-indigo-600">{monthlyReport.total_rewards}</p>
                      </div>
                    </div>
                  )}
                </Card>
              </TabsContent>

              {/* Comparison */}
              <TabsContent value="comparison" className="space-y-6">
                <Card className="p-6 shadow-lg">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Perbandingan Semua Anak</h2>
                  {comparisonChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={comparisonChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="name" stroke="#6b7280" angle={-45} textAnchor="end" height={80} />
                        <YAxis stroke="#6b7280" />
                        <Tooltip 
                          contentStyle={{
                            backgroundColor: '#fff',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px'
                          }}
                        />
                        <Legend />
                        <Bar dataKey="sessions" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                        <Bar dataKey="goals" fill="#10b981" radius={[8, 8, 0, 0]} />
                        <Bar dataKey="rewards" fill="#f59e0b" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-gray-500 text-center py-8">Belum ada data perbandingan</p>
                  )}
                </Card>

                {comparisonStats && (
                  <Card className="p-6 shadow-lg">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Rata-rata Per Anak</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center">
                        <p className="text-sm text-gray-600 mb-2">Rata-rata Sesi</p>
                        <p className="text-2xl font-bold text-blue-600">
                          {comparisonStats.average_sessions?.toFixed(1) || 0}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-gray-600 mb-2">Rata-rata Tujuan</p>
                        <p className="text-2xl font-bold text-green-600">
                          {comparisonStats.average_goals?.toFixed(1) || 0}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-gray-600 mb-2">Rata-rata Reward</p>
                        <p className="text-2xl font-bold text-amber-600">
                          {comparisonStats.average_rewards?.toFixed(1) || 0}
                        </p>
                      </div>
                    </div>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
