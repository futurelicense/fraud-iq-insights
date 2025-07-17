
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Brain, 
  TrendingUp, 
  AlertTriangle, 
  Shield,
  Target,
  Lightbulb
} from 'lucide-react';
import { AnalyzedClaim } from '../types/fraud';

interface AIInsightsPanelProps {
  claims: AnalyzedClaim[];
}

export function AIInsightsPanel({ claims }: AIInsightsPanelProps) {
  const insights = React.useMemo(() => {
    if (claims.length === 0) return null;

    const highRiskClaims = claims.filter(c => c.analysis.fraud_score > 0.7);
    const uniqueIPs = new Set(claims.map(c => c.IP_Address)).size;
    const uniqueDevices = new Set(claims.map(c => c.Device_ID)).size;
    const totalClaims = claims.length;
    const avgRiskScore = claims.reduce((sum, c) => sum + c.analysis.fraud_score, 0) / totalClaims;

    // Pattern detection
    const ipCounts: Record<string, number> = {};
    const deviceCounts: Record<string, number> = {};
    claims.forEach(claim => {
      ipCounts[claim.IP_Address] = (ipCounts[claim.IP_Address] || 0) + 1;
      deviceCounts[claim.Device_ID] = (deviceCounts[claim.Device_ID] || 0) + 1;
    });

    const suspiciousIPs = Object.entries(ipCounts).filter(([_, count]) => count > 1);
    const suspiciousDevices = Object.entries(deviceCounts).filter(([_, count]) => count > 1);

    // Top employers by risk
    const employerRisks: Record<string, { total: number; count: number }> = {};
    claims.forEach(claim => {
      if (!employerRisks[claim.Employer_Name]) {
        employerRisks[claim.Employer_Name] = { total: 0, count: 0 };
      }
      employerRisks[claim.Employer_Name].total += claim.analysis.fraud_score;
      employerRisks[claim.Employer_Name].count += 1;
    });

    const topRiskyEmployer = Object.entries(employerRisks)
      .map(([name, data]) => ({ name, avgRisk: data.total / data.count, count: data.count }))
      .sort((a, b) => b.avgRisk - a.avgRisk)[0];

    return {
      highRiskClaims,
      uniqueIPs,
      uniqueDevices,
      totalClaims,
      avgRiskScore,
      suspiciousIPs,
      suspiciousDevices,
      topRiskyEmployer
    };
  }, [claims]);

  if (!insights) {
    return (
      <Card className="card-hover">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Brain className="h-5 w-5" />
            <span>AI Insights</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Upload claims data to see AI-generated insights</p>
        </CardContent>
      </Card>
    );
  }

  const getInsightSeverity = (type: string) => {
    switch (type) {
      case 'critical': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'warning': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'info': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="space-y-6">
      {/* Key Insights Summary */}
      <Card className="card-hover">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Brain className="h-5 w-5" />
            <span>AI-Generated Insights</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* High-level patterns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg">
              <TrendingUp className="h-5 w-5 text-blue-400" />
              <div>
                <p className="text-sm font-medium">Average Risk Score</p>
                <p className="text-lg font-bold text-blue-400">
                  {(insights.avgRiskScore * 100).toFixed(1)}%
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-orange-400" />
              <div>
                <p className="text-sm font-medium">High Risk Claims</p>
                <p className="text-lg font-bold text-orange-400">
                  {insights.highRiskClaims.length} / {insights.totalClaims}
                </p>
              </div>
            </div>
          </div>

          {/* Pattern Detection Insights */}
          <div className="space-y-3">
            <h4 className="font-semibold flex items-center space-x-2">
              <Shield className="h-4 w-4" />
              <span>Pattern Detection</span>
            </h4>
            
            {insights.suspiciousIPs.length > 0 && (
              <div className="p-3 border border-orange-500/30 rounded-lg bg-orange-500/5">
                <div className="flex items-start space-x-2">
                  <Badge className={getInsightSeverity('warning')}>Warning</Badge>
                  <div>
                    <p className="text-sm font-medium">Multiple Claims from Same IP</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {insights.suspiciousIPs.length} IP address(es) associated with multiple claims. 
                      Top IP: {insights.suspiciousIPs[0][0]} ({insights.suspiciousIPs[0][1]} claims)
                    </p>
                  </div>
                </div>
              </div>
            )}

            {insights.suspiciousDevices.length > 0 && (
              <div className="p-3 border border-orange-500/30 rounded-lg bg-orange-500/5">
                <div className="flex items-start space-x-2">
                  <Badge className={getInsightSeverity('warning')}>Warning</Badge>
                  <div>
                    <p className="text-sm font-medium">Shared Device Usage</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {insights.suspiciousDevices.length} device(s) linked to multiple claims.
                      This may indicate coordinated fraud attempts.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {insights.topRiskyEmployer && insights.topRiskyEmployer.avgRisk > 0.6 && (
              <div className="p-3 border border-red-500/30 rounded-lg bg-red-500/5">
                <div className="flex items-start space-x-2">
                  <Badge className={getInsightSeverity('critical')}>Critical</Badge>
                  <div>
                    <p className="text-sm font-medium">High-Risk Employer Pattern</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {insights.topRiskyEmployer.name} has an average risk score of {(insights.topRiskyEmployer.avgRisk * 100).toFixed(1)}% 
                      across {insights.topRiskyEmployer.count} claims. Consider enhanced verification.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Priority Claims for Review */}
      <Card className="card-hover">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Target className="h-5 w-5" />
            <span>Priority Claims for Review</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {insights.highRiskClaims.slice(0, 5).map((claim, index) => (
              <div key={claim.Claim_ID} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center justify-center w-6 h-6 bg-red-500/20 text-red-400 rounded-full text-xs font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium">{claim.Claim_ID}</p>
                    <p className="text-sm text-muted-foreground">{claim.Name}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-red-400">
                    {(claim.analysis.fraud_score * 100).toFixed(1)}%
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {claim.analysis.flags.length} flags
                  </p>
                </div>
              </div>
            ))}
            
            {insights.highRiskClaims.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Shield className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No high-risk claims detected</p>
                <p className="text-sm">All claims appear to be within normal risk parameters</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Card className="card-hover">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Lightbulb className="h-5 w-5" />
            <span>AI Recommendations</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="p-3 border-l-4 border-blue-500 bg-blue-500/5 rounded-r-lg">
              <p className="text-sm font-medium">Enhanced Monitoring</p>
              <p className="text-sm text-muted-foreground mt-1">
                Set up alerts for claims from the {insights.suspiciousIPs.length} flagged IP addresses
                and {insights.suspiciousDevices.length} suspicious devices.
              </p>
            </div>
            
            <div className="p-3 border-l-4 border-green-500 bg-green-500/5 rounded-r-lg">
              <p className="text-sm font-medium">Process Improvement</p>
              <p className="text-sm text-muted-foreground mt-1">
                Consider implementing additional identity verification for claims above 70% risk score
                to reduce false positives and improve detection accuracy.
              </p>
            </div>
            
            {insights.avgRiskScore > 0.5 && (
              <div className="p-3 border-l-4 border-orange-500 bg-orange-500/5 rounded-r-lg">
                <p className="text-sm font-medium">System Alert</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Average risk score is elevated at {(insights.avgRiskScore * 100).toFixed(1)}%. 
                  Consider reviewing recent process changes or external factors affecting claim quality.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
