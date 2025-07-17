
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { DashboardStats } from '../../types/fraud';

interface RiskDistributionChartProps {
  stats: DashboardStats;
}

export function RiskDistributionChart({ stats }: RiskDistributionChartProps) {
  const data = [
    { name: 'Low', value: stats.low_risk, color: '#10b981' },
    { name: 'Medium', value: stats.medium_risk, color: '#f59e0b' },
    { name: 'High', value: stats.high_risk, color: '#ef4444' },
    { name: 'Severe', value: stats.severe_risk, color: '#dc2626' }
  ];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const value = payload[0].value;
      const percentage = ((value / stats.total_claims) * 100).toFixed(1);
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{`${label} Risk`}</p>
          <p className="text-primary">{`Claims: ${value}`}</p>
          <p className="text-muted-foreground text-sm">{`${percentage}% of total`}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="card-hover">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <span>Risk Distribution</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted-foreground))" opacity={0.2} />
            <XAxis 
              dataKey="name" 
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
              axisLine={{ stroke: 'hsl(var(--muted-foreground))' }}
            />
            <YAxis 
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
              axisLine={{ stroke: 'hsl(var(--muted-foreground))' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
