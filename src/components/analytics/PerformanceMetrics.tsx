import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Activity, Clock, Target, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';

interface PerformanceData {
  detectionAccuracy: number;
  falsePositiveRate: number;
  processingTime: number;
  totalCasesProcessed: number;
  accuracyTrend: Array<{ date: string; accuracy: number; }>;
  processingTimes: Array<{ hour: string; avgTime: number; }>;
  alertDistribution: Array<{ severity: string; count: number; }>;
}

const PerformanceMetrics: React.FC = () => {
  const [performanceData, setPerformanceData] = useState<PerformanceData>({
    detectionAccuracy: 0,
    falsePositiveRate: 0,
    processingTime: 0,
    totalCasesProcessed: 0,
    accuracyTrend: [],
    processingTimes: [],
    alertDistribution: []
  });

  useEffect(() => {
    const generateMockData = (): PerformanceData => {
      const accuracyTrend = Array.from({ length: 30 }, (_, i) => ({
        date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toLocaleDateString(),
        accuracy: 85 + Math.random() * 10,
      }));

      const processingTimes = Array.from({ length: 24 }, (_, i) => ({
        hour: `${i.toString().padStart(2, '0')}:00`,
        avgTime: 200 + Math.random() * 300,
      }));

      const alertDistribution = [
        { severity: 'Critical', count: 24 },
        { severity: 'High', count: 67 },
        { severity: 'Medium', count: 145 },
        { severity: 'Low', count: 89 },
      ];

      return {
        detectionAccuracy: 92.5,
        falsePositiveRate: 3.2,
        processingTime: 285,
        totalCasesProcessed: 1547,
        accuracyTrend,
        processingTimes,
        alertDistribution,
      };
    };

    setPerformanceData(generateMockData());

    // Simulate real-time updates
    const interval = setInterval(() => {
      setPerformanceData(prev => ({
        ...prev,
        detectionAccuracy: Math.min(99, prev.detectionAccuracy + (Math.random() - 0.5) * 0.5),
        falsePositiveRate: Math.max(0, prev.falsePositiveRate + (Math.random() - 0.5) * 0.2),
        processingTime: Math.max(100, prev.processingTime + (Math.random() - 0.5) * 20),
        totalCasesProcessed: prev.totalCasesProcessed + Math.floor(Math.random() * 3),
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const getAccuracyStatus = (accuracy: number) => {
    if (accuracy >= 95) return { status: 'excellent', color: 'success', icon: TrendingUp };
    if (accuracy >= 90) return { status: 'good', color: 'success', icon: TrendingUp };
    if (accuracy >= 85) return { status: 'fair', color: 'warning', icon: TrendingDown };
    return { status: 'poor', color: 'destructive', icon: AlertCircle };
  };

  const accuracyStatus = getAccuracyStatus(performanceData.detectionAccuracy);
  const StatusIcon = accuracyStatus.icon;

  const COLORS = {
    Critical: 'hsl(var(--destructive))',
    High: 'hsl(var(--destructive) / 0.7)',
    Medium: 'hsl(var(--warning))',
    Low: 'hsl(var(--success))',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Activity className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-bold">Performance Metrics</h2>
      </div>

      {/* Key Performance Indicators */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Detection Accuracy</CardTitle>
            <StatusIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{performanceData.detectionAccuracy.toFixed(1)}%</div>
            <div className="flex items-center gap-2 mt-2">
              <Progress value={performanceData.detectionAccuracy} className="flex-1" />
              <Badge variant={accuracyStatus.color === 'success' ? 'default' : 
                            accuracyStatus.color === 'warning' ? 'secondary' : 'destructive'}>
                {accuracyStatus.status}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">False Positive Rate</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{performanceData.falsePositiveRate.toFixed(1)}%</div>
            <div className="flex items-center gap-2 mt-2">
              <Progress value={performanceData.falsePositiveRate} className="flex-1" />
              <Badge variant={performanceData.falsePositiveRate < 5 ? 'default' : 'destructive'}>
                {performanceData.falsePositiveRate < 5 ? 'Good' : 'High'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Processing Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{performanceData.processingTime.toFixed(0)}ms</div>
            <div className="flex items-center gap-2 mt-2">
              <Progress value={Math.min(100, (500 - performanceData.processingTime) / 5)} className="flex-1" />
              <Badge variant={performanceData.processingTime < 300 ? 'default' : 'secondary'}>
                {performanceData.processingTime < 300 ? 'Fast' : 'Slow'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cases Processed</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{performanceData.totalCasesProcessed.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-2">
              Total cases processed today
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Performance Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Accuracy Trend (30 Days)</CardTitle>
            <CardDescription>Detection accuracy over the last 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={performanceData.accuracyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="date" 
                  stroke="hsl(var(--muted-foreground))"
                  tick={{ fontSize: 12 }}
                  interval="preserveStartEnd"
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))"
                  domain={[80, 100]}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }} 
                  formatter={(value: number) => [`${value.toFixed(1)}%`, 'Accuracy']}
                />
                <Line 
                  type="monotone" 
                  dataKey="accuracy" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Processing Time by Hour</CardTitle>
            <CardDescription>Average processing time throughout the day</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={performanceData.processingTimes}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="hour" 
                  stroke="hsl(var(--muted-foreground))"
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))"
                  tick={{ fontSize: 12 }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }} 
                  formatter={(value: number) => [`${value.toFixed(0)}ms`, 'Avg Time']}
                />
                <Bar dataKey="avgTime" fill="hsl(var(--secondary))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Alert Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Alert Distribution</CardTitle>
          <CardDescription>Distribution of alerts by severity level</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={performanceData.alertDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {performanceData.alertDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[entry.severity as keyof typeof COLORS]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            
            <div className="space-y-3">
              {performanceData.alertDistribution.map((alert, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-4 h-4 rounded-full" 
                      style={{ backgroundColor: COLORS[alert.severity as keyof typeof COLORS] }}
                    />
                    <span className="font-medium">{alert.severity}</span>
                  </div>
                  <span className="text-xl font-bold">{alert.count}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PerformanceMetrics;