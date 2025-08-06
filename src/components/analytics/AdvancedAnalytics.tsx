import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, AlertTriangle, Shield, Map } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import GeographicalHeatMap from './GeographicalHeatMap';

interface AnalyticsData {
  fraudTrends: Array<{ date: string; detected: number; prevented: number; }>;
  fraudPatterns: Array<{ pattern: string; count: number; severity: 'low' | 'medium' | 'high' | 'critical'; }>;
  riskDistribution: Array<{ risk: string; count: number; }>;
  detectionAccuracy: Array<{ month: string; accuracy: number; falsePositives: number; }>;
  geographicalData: Array<{ state: string; lat: number; lng: number; riskLevel: number; fraudCount: number; }>;
}

const AdvancedAnalytics: React.FC = () => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    fraudTrends: [],
    fraudPatterns: [],
    riskDistribution: [],
    detectionAccuracy: [],
    geographicalData: []
  });

  useEffect(() => {
    // Generate mock analytics data
    const generateMockData = (): AnalyticsData => {
      const fraudTrends = Array.from({ length: 12 }, (_, i) => ({
        date: new Date(2024, i, 1).toLocaleDateString('en-US', { month: 'short' }),
        detected: Math.floor(Math.random() * 100) + 50,
        prevented: Math.floor(Math.random() * 80) + 30,
      }));

      const fraudPatterns = [
        { pattern: 'Identity Theft', count: 145, severity: 'critical' as const },
        { pattern: 'Duplicate Claims', count: 98, severity: 'high' as const },
        { pattern: 'Wage Manipulation', count: 76, severity: 'high' as const },
        { pattern: 'Employer Fraud', count: 54, severity: 'medium' as const },
        { pattern: 'Address Fraud', count: 32, severity: 'medium' as const },
        { pattern: 'Document Forgery', count: 28, severity: 'low' as const },
      ];

      const riskDistribution = [
        { risk: 'Low', count: 342 },
        { risk: 'Medium', count: 156 },
        { risk: 'High', count: 78 },
        { risk: 'Critical', count: 24 },
      ];

      const detectionAccuracy = Array.from({ length: 6 }, (_, i) => ({
        month: new Date(2024, i + 6, 1).toLocaleDateString('en-US', { month: 'short' }),
        accuracy: Math.floor(Math.random() * 10) + 85,
        falsePositives: Math.floor(Math.random() * 5) + 2,
      }));

      const geographicalData = [
        { state: 'California', lat: 36.7783, lng: -119.4179, riskLevel: 8.5, fraudCount: 234 },
        { state: 'Texas', lat: 31.9686, lng: -99.9018, riskLevel: 7.2, fraudCount: 198 },
        { state: 'Florida', lat: 27.7663, lng: -81.6868, riskLevel: 6.8, fraudCount: 156 },
        { state: 'New York', lat: 42.1657, lng: -74.9481, riskLevel: 6.1, fraudCount: 145 },
        { state: 'Illinois', lat: 40.3363, lng: -89.0022, riskLevel: 5.4, fraudCount: 87 },
      ];

      return { fraudTrends, fraudPatterns, riskDistribution, detectionAccuracy, geographicalData };
    };

    setAnalyticsData(generateMockData());
  }, []);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'hsl(var(--destructive))';
      case 'high': return 'hsl(var(--destructive) / 0.8)';
      case 'medium': return 'hsl(var(--warning))';
      case 'low': return 'hsl(var(--success))';
      default: return 'hsl(var(--muted))';
    }
  };

  const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--destructive))'];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <TrendingUp className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-bold">Advanced Analytics</h2>
      </div>

      <Tabs defaultValue="trends" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="trends">Fraud Trends</TabsTrigger>
          <TabsTrigger value="patterns">Pattern Analysis</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="geography">Geographic</TabsTrigger>
        </TabsList>

        <TabsContent value="trends" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Fraud Detection Trends
                </CardTitle>
                <CardDescription>Monthly fraud detection and prevention statistics</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={analyticsData.fraudTrends}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }} 
                    />
                    <Legend />
                    <Area type="monotone" dataKey="detected" stackId="1" stroke="hsl(var(--destructive))" fill="hsl(var(--destructive) / 0.2)" />
                    <Area type="monotone" dataKey="prevented" stackId="1" stroke="hsl(var(--success))" fill="hsl(var(--success) / 0.2)" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Risk Distribution</CardTitle>
                <CardDescription>Current risk level distribution across all claims</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={analyticsData.riskDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {analyticsData.riskDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="patterns" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Fraud Pattern Analysis
              </CardTitle>
              <CardDescription>Most common fraud patterns detected in the system</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analyticsData.fraudPatterns} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" stroke="hsl(var(--muted-foreground))" />
                    <YAxis dataKey="pattern" type="category" width={120} stroke="hsl(var(--muted-foreground))" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }} 
                    />
                    <Bar dataKey="count" fill="hsl(var(--primary))" />
                  </BarChart>
                </ResponsiveContainer>
                
                <div className="grid gap-2">
                  {analyticsData.fraudPatterns.map((pattern, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Badge variant={pattern.severity === 'critical' ? 'destructive' : 
                                      pattern.severity === 'high' ? 'secondary' : 
                                      pattern.severity === 'medium' ? 'outline' : 'default'}>
                          {pattern.severity.toUpperCase()}
                        </Badge>
                        <span className="font-medium">{pattern.pattern}</span>
                      </div>
                      <span className="text-2xl font-bold text-primary">{pattern.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Detection Performance Metrics</CardTitle>
              <CardDescription>System accuracy and false positive rates over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analyticsData.detectionAccuracy}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }} 
                  />
                  <Legend />
                  <Line type="monotone" dataKey="accuracy" stroke="hsl(var(--success))" strokeWidth={3} name="Accuracy %" />
                  <Line type="monotone" dataKey="falsePositives" stroke="hsl(var(--destructive))" strokeWidth={3} name="False Positives %" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="geography" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Map className="h-4 w-4" />
                Geographical Risk Analysis
              </CardTitle>
              <CardDescription>Fraud risk distribution by geographic location</CardDescription>
            </CardHeader>
            <CardContent>
              <GeographicalHeatMap data={analyticsData.geographicalData} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdvancedAnalytics;