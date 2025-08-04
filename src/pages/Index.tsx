
import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { 
  Shield, 
  BarChart3, 
  Brain, 
  Upload,
  AlertTriangle,
  TrendingUp,
  Download,
  FileText
} from 'lucide-react';

import { FileUpload } from '../components/FileUpload';
import { HuggingFaceSetup } from '../components/HuggingFaceSetup';
import { StatsCards } from '../components/dashboard/StatsCards';
import { RiskDistributionChart } from '../components/dashboard/RiskDistributionChart';
import { ClaimsTable } from '../components/dashboard/ClaimsTable';
import { AnalyticsPanel } from '../components/dashboard/AnalyticsPanel';
import { AIInsightsPanel } from '../components/AIInsightsPanel';

import { EnterpriseFraudAnalyzer } from '../services/EnterpriseeFraudAnalyzer';
import { ClaimData, AnalyzedClaim, DashboardStats } from '../types/fraud';
import { RiskAssessmentResult } from '../types/enterprise';

const Index = () => {
  const [claims, setClaims] = useState<ClaimData[]>([]);
  const [analyzedClaims, setAnalyzedClaims] = useState<AnalyzedClaim[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [isHuggingFaceConfigured, setIsHuggingFaceConfigured] = useState(false);
  const [enterpriseAnalyzer] = useState(() => new EnterpriseFraudAnalyzer());
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    total_claims: 0,
    low_risk: 0,
    medium_risk: 0,
    high_risk: 0,
    severe_risk: 0,
    avg_fraud_score: 0,
    total_flagged: 0
  });

  const handleDataLoaded = async (data: ClaimData[]) => {
    setClaims(data);
    setAnalyzedClaims([]);
    setAnalysisProgress(0);
    
    toast.success(`Successfully loaded ${data.length} claims`);
    
    // Start analysis
    setIsAnalyzing(true);
    
    try {
      const analyses: AnalyzedClaim[] = [];
      
      for (let i = 0; i < data.length; i++) {
        const legacyClaim = data[i];
        
        // Convert legacy data to enterprise format
        const { claim, claimant, employer, contextData } = enterpriseAnalyzer.convertLegacyToEnterprise(legacyClaim);
        
        // Perform enterprise fraud analysis
        const riskAssessment: RiskAssessmentResult = await enterpriseAnalyzer.analyzeClaimEnterprise(
          claim, 
          claimant, 
          employer, 
          contextData
        );
        
        // Convert back to legacy format for UI compatibility
        const analysis = {
          claim_id: riskAssessment.claimId,
          fraud_score: riskAssessment.overallRiskScore / 1000, // Normalize to 0-1 scale
          fraud_label: (riskAssessment.riskLevel === 'CRITICAL' ? 'Severe' : 
                       riskAssessment.riskLevel === 'HIGH' ? 'High' :
                       riskAssessment.riskLevel === 'MEDIUM' ? 'Medium' : 'Low') as 'Low' | 'Medium' | 'High' | 'Severe',
          explanation: riskAssessment.riskFactors.map(f => f.description).join('; '),
          flags: riskAssessment.riskFactors.map(f => f.factorName),
          recommendation: riskAssessment.recommendedActions.join('; '),
          confidence: riskAssessment.confidenceScore,
          analyzed_at: riskAssessment.assessmentDate
        };
        
        const analyzedClaim: AnalyzedClaim = {
          ...legacyClaim,
          analysis
        };
        
        analyses.push(analyzedClaim);
        setAnalysisProgress(((i + 1) / data.length) * 100);
        
        // Update state incrementally for real-time feel
        setAnalyzedClaims([...analyses]);
      }
      
      toast.success(`Analysis complete! Processed ${data.length} claims`);
    } catch (error) {
      console.error('Analysis error:', error);
      toast.error('Failed to analyze claims. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleApiKeySet = (apiKey: string) => {
    if (apiKey) {
      enterpriseAnalyzer.setApiKey(apiKey);
      setIsHuggingFaceConfigured(true);
      toast.success('Enterprise AI fraud analysis configured successfully');
    } else {
      setIsHuggingFaceConfigured(true);
      toast.info('Continuing in demo mode with enterprise business rules');
    }
  };

  const handleExportClaims = (claimsToExport: AnalyzedClaim[]) => {
    const csvData = claimsToExport.map(claim => ({
      ...claim,
      fraud_score: claim.analysis.fraud_score,
      fraud_label: claim.analysis.fraud_label,
      flags: claim.analysis.flags.join('; '),
      recommendation: claim.analysis.recommendation,
      explanation: claim.analysis.explanation
    }));

    const headers = Object.keys(csvData[0] || {});
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => 
        headers.map(header => {
          const value = (row as any)[header];
          return typeof value === 'string' && value.includes(',') 
            ? `"${value.replace(/"/g, '""')}"` 
            : value;
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fraud_analysis_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('Analysis results exported successfully');
  };

  // Update dashboard stats when analyzed claims change
  useEffect(() => {
    if (analyzedClaims.length > 0) {
      const stats = analyzedClaims.reduce(
        (acc, claim) => {
          acc.total_claims++;
          acc.avg_fraud_score += claim.analysis.fraud_score;
          
          if (claim.analysis.fraud_score > 0.5) {
            acc.total_flagged++;
          }
          
          switch (claim.analysis.fraud_label) {
            case 'Low':
              acc.low_risk++;
              break;
            case 'Medium':
              acc.medium_risk++;
              break;
            case 'High':
              acc.high_risk++;
              break;
            case 'Severe':
              acc.severe_risk++;
              break;
          }
          
          return acc;
        },
        {
          total_claims: 0,
          low_risk: 0,
          medium_risk: 0,
          high_risk: 0,
          severe_risk: 0,
          avg_fraud_score: 0,
          total_flagged: 0
        }
      );
      
      stats.avg_fraud_score = stats.avg_fraud_score / stats.total_claims;
      setDashboardStats(stats);
    }
  }, [analyzedClaims]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary rounded-lg">
              <Shield className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold">FraudIQ™</h1>
              <p className="text-xs text-muted-foreground">AI-Powered Fraud Detection</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {analyzedClaims.length > 0 && (
              <Button variant="outline" size="sm" onClick={() => handleExportClaims(analyzedClaims)}>
                <Download className="h-4 w-4 mr-2" />
                Export All
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Setup Section */}
        {!isHuggingFaceConfigured && (
          <HuggingFaceSetup 
            onApiKeySet={handleApiKeySet}
            isConfigured={isHuggingFaceConfigured}
          />
        )}

        {/* File Upload Section */}
        {isHuggingFaceConfigured && claims.length === 0 && (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold">Upload Claims Data</h2>
              <p className="text-muted-foreground">
                Get started by uploading your unemployment insurance claims CSV file
              </p>
            </div>
            <FileUpload onDataLoaded={handleDataLoaded} isLoading={isAnalyzing} />
          </div>
        )}

        {/* Analysis Progress */}
        {isAnalyzing && (
          <Card className="card-hover">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Brain className="h-5 w-5 animate-pulse" />
                <span>AI Analysis in Progress</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span>Processing claims with fraud detection models...</span>
                <span>{Math.round(analysisProgress)}%</span>
              </div>
              <Progress value={analysisProgress} className="w-full" />
              <p className="text-xs text-muted-foreground">
                Analyzing patterns, risk indicators, and generating explanations using AI models
              </p>
            </CardContent>
          </Card>
        )}

        {/* Dashboard Content */}
        {analyzedClaims.length > 0 && (
          <Tabs defaultValue="overview" className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
              <TabsList className="grid w-full sm:w-auto grid-cols-3">
                <TabsTrigger value="overview" className="flex items-center space-x-2">
                  <BarChart3 className="h-4 w-4" />
                  <span>Overview</span>
                </TabsTrigger>
                <TabsTrigger value="claims" className="flex items-center space-x-2">
                  <FileText className="h-4 w-4" />
                  <span>Claims</span>
                </TabsTrigger>
                <TabsTrigger value="insights" className="flex items-center space-x-2">
                  <Brain className="h-4 w-4" />
                  <span>AI Insights</span>
                </TabsTrigger>
              </TabsList>
              
              <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                <span>Last updated: {new Date().toLocaleTimeString()}</span>
                <Button variant="outline" size="sm" onClick={() => handleDataLoaded(claims)}>
                  Re-analyze
                </Button>
              </div>
            </div>

            <TabsContent value="overview" className="space-y-6">
              <StatsCards stats={dashboardStats} />
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <RiskDistributionChart stats={dashboardStats} />
                <AnalyticsPanel claims={analyzedClaims} />
              </div>
            </TabsContent>

            <TabsContent value="claims" className="space-y-6">
              <ClaimsTable claims={analyzedClaims} onExport={handleExportClaims} />
            </TabsContent>

            <TabsContent value="insights" className="space-y-6">
              <AIInsightsPanel claims={analyzedClaims} />
            </TabsContent>
          </Tabs>
        )}
      </main>
    </div>
  );
};

export default Index;
