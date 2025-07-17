
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, MapPin, Flag, Building } from 'lucide-react';
import { AnalyzedClaim } from '../../types/fraud';

interface AnalyticsPanelProps {
  claims: AnalyzedClaim[];
}

export function AnalyticsPanel({ claims }: AnalyticsPanelProps) {
  // Process data for analytics
  const timeSeriesData = React.useMemo(() => {
    const dateGroups: Record<string, { claims: number; total_risk: number; flagged: number }> = {};
    
    claims.forEach(claim => {
      const date = new Date(claim.Claim_Date).toISOString().split('T')[0];
      if (!dateGroups[date]) {
        dateGroups[date] = { claims: 0, total_risk: 0, flagged: 0 };
      }
      dateGroups[date].claims += 1;
      dateGroups[date].total_risk += claim.analysis.fraud_score;
      if (claim.analysis.fraud_score > 0.5) {
        dateGroups[date].flagged += 1;
      }
    });

    return Object.entries(dateGroups)
      .map(([date, data]) => ({
        date,
        claims: data.claims,
        avg_risk: (data.total_risk / data.claims) * 100,
        flagged: data.flagged
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [claims]);

  const flagFrequencyData = React.useMemo(() => {
    const flagCounts: Record<string, number> = {};
    
    claims.forEach(claim => {
      claim.analysis.flags.forEach(flag => {
        flagCounts[flag] = (flagCounts[flag] || 0) + 1;
      });
    });

    return Object.entries(flagCounts)
      .map(([flag, count]) => ({
        flag: flag.length > 25 ? flag.substring(0, 25) + '...' : flag,
        count,
        percentage: (count / claims.length) * 100
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }, [claims]);

  const employerRiskData = React.useMemo(() => {
    const employerStats: Record<string, { risk_total: number; count: number; amount_total: number }> = {};
    
    claims.forEach(claim => {
      const employer = claim.Employer_Name;
      if (!employerStats[employer]) {
        employerStats[employer] = { risk_total: 0, count: 0, amount_total: 0 };
      }
      employerStats[employer].risk_total += claim.analysis.fraud_score;
      employerStats[employer].count += 1;
      employerStats[employer].amount_total += parseFloat(claim.Claim_Amount) || 0;
    });

    return Object.entries(employerStats)
      .map(([employer, stats]) => ({
        employer: employer.length > 20 ? employer.substring(0, 20) + '...' : employer,
        avg_risk: (stats.risk_total / stats.count) * 100,
        claim_count: stats.count,
        total_amount: stats.amount_total
      }))
      .sort((a, b) => b.avg_risk - a.avg_risk)
      .slice(0, 5);
  }, [claims]);

  const riskDistributionPieData = React.useMemo(() => {
    const distribution = { Low: 0, Medium: 0, High: 0, Severe: 0 };
    claims.forEach(claim => {
      distribution[claim.analysis.fraud_label]++;
    });

    return Object.entries(distribution).map(([risk, count]) => ({
      name: risk,
      value: count,
      color: risk === 'Low' ? '#10b981' :
             risk === 'Medium' ? '#f59e0b' :
             risk === 'High' ? '#ef4444' : '#dc2626'
    }));
  }, [claims]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }}>
              {`${entry.dataKey}: ${entry.value}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Time Series Chart */}
      <Card className="card-hover">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5" />
            <span>Claims Trend</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={timeSeriesData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted-foreground))" opacity={0.2} />
              <XAxis 
                dataKey="date" 
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
                axisLine={{ stroke: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis 
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
                axisLine={{ stroke: 'hsl(var(--muted-foreground))' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line 
                type="monotone" 
                dataKey="claims" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                dot={{ fill: 'hsl(var(--primary))' }}
              />
              <Line 
                type="monotone" 
                dataKey="avg_risk" 
                stroke="hsl(var(--chart-1))" 
                strokeWidth={2}
                dot={{ fill: 'hsl(var(--chart-1))' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Risk Distribution Pie */}
      <Card className="card-hover">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MapPin className="h-5 w-5" />
            <span>Risk Distribution</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={riskDistributionPieData}
                cx="50%"
                cy="50%"
                outerRadius={80}
                dataKey="value"
                label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                labelLine={false}
              >
                {riskDistributionPieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Flag Frequency */}
      <Card className="card-hover">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Flag className="h-5 w-5" />
            <span>Common Fraud Flags</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {flagFrequencyData.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium">{item.flag}</p>
                  <div className="w-full bg-muted rounded-full h-2 mt-1">
                    <div 
                      className="bg-orange-500 h-2 rounded-full transition-all"
                      style={{ width: `${(item.count / claims.length) * 100}%` }}
                    />
                  </div>
                </div>
                <div className="ml-4 text-right">
                  <p className="text-sm font-bold">{item.count}</p>
                  <p className="text-xs text-muted-foreground">{item.percentage.toFixed(1)}%</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Employer Risk Analysis */}
      <Card className="card-hover">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Building className="h-5 w-5" />
            <span>High-Risk Employers</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {employerRiskData.map((employer, index) => (
              <div key={index} className="border rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-medium">{employer.employer}</p>
                  <span className={`text-sm font-bold ${
                    employer.avg_risk > 70 ? 'text-red-400' :
                    employer.avg_risk > 50 ? 'text-orange-400' : 'text-yellow-400'
                  }`}>
                    {employer.avg_risk.toFixed(1)}%
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>{employer.claim_count} claims</span>
                  <span>${employer.total_amount.toLocaleString()}</span>
                </div>
                <div className="w-full bg-muted rounded-full h-1.5 mt-2">
                  <div 
                    className={`h-1.5 rounded-full transition-all ${
                      employer.avg_risk > 70 ? 'bg-red-500' :
                      employer.avg_risk > 50 ? 'bg-orange-500' : 'bg-yellow-500'
                    }`}
                    style={{ width: `${employer.avg_risk}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
