
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Shield, 
  AlertTriangle, 
  TrendingUp, 
  Users,
  DollarSign,
  Clock
} from 'lucide-react';
import { DashboardStats } from '../../types/fraud';

interface StatsCardsProps {
  stats: DashboardStats;
}

export function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    {
      title: 'Total Claims',
      value: stats.total_claims.toLocaleString(),
      icon: Users,
      color: 'text-blue-400',
      bgColor: 'bg-blue-400/10'
    },
    {
      title: 'Flagged Claims',
      value: stats.total_flagged.toLocaleString(),
      icon: AlertTriangle,
      color: 'text-red-400',
      bgColor: 'bg-red-400/10',
      subtitle: `${((stats.total_flagged / stats.total_claims) * 100).toFixed(1)}% of total`
    },
    {
      title: 'High Risk',
      value: (stats.high_risk + stats.severe_risk).toLocaleString(),
      icon: Shield,
      color: 'text-orange-400',
      bgColor: 'bg-orange-400/10',
      subtitle: 'Requires investigation'
    },
    {
      title: 'Avg Risk Score',
      value: `${(stats.avg_fraud_score * 100).toFixed(1)}%`,
      icon: TrendingUp,
      color: 'text-green-400',
      bgColor: 'bg-green-400/10'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card, index) => (
        <Card key={index} className="card-hover">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {card.title}
            </CardTitle>
            <div className={`p-2 rounded-lg ${card.bgColor}`}>
              <card.icon className={`h-4 w-4 ${card.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{card.value}</div>
            {card.subtitle && (
              <p className="text-xs text-muted-foreground mt-1">
                {card.subtitle}
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
