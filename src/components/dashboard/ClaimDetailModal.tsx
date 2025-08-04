
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
  User, 
  Phone, 
  Mail, 
  Calendar, 
  Building, 
  DollarSign,
  Shield,
  AlertTriangle,
  Clock,
  Monitor
} from 'lucide-react';
import { AnalyzedClaim } from '../../types/fraud';

interface ClaimDetailModalProps {
  claim: AnalyzedClaim;
  isOpen: boolean;
  onClose: () => void;
}

export function ClaimDetailModal({ claim, isOpen, onClose }: ClaimDetailModalProps) {
  const getRiskBadgeColor = (label: string) => {
    switch (label.toLowerCase()) {
      case 'low': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'high': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'severe': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getRecommendationColor = (recommendation: string) => {
    if (recommendation.includes('DENY')) return 'text-red-400';
    if (recommendation.includes('HOLD')) return 'text-orange-400';
    if (recommendation.includes('REVIEW')) return 'text-yellow-400';
    if (recommendation.includes('MONITOR')) return 'text-blue-400';
    return 'text-green-400';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-3">
            <span>Claim Analysis: {claim.Claim_ID}</span>
            <Badge className={getRiskBadgeColor(claim.analysis.fraud_label)}>
              {claim.analysis.fraud_label} Risk
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Claimant Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span>Claimant Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Full Name</p>
                  <p className="font-medium">{claim.Name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Claimant ID</p>
                  <p className="font-medium">{claim.Claimant_ID}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Date of Birth</p>
                  <p className="font-medium">{claim.DOB}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">SSN Hash</p>
                  <p className="font-medium font-mono text-sm">{claim.SSN_Hash}</p>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{claim.Email}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{claim.Phone}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Monitor className="h-4 w-4 text-muted-foreground" />
                  <span className="font-mono text-sm">{claim.IP_Address}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <span className="font-mono text-sm">{claim.Device_ID}</span>
                </div>
              </div>
              
              {/* Enterprise Identity Verification */}
              {(claim as any).Identity_Verification_Status && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Identity Verification</p>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Status:</span>
                        <Badge variant={(claim as any).Identity_Verification_Status === 'VERIFIED' ? 'default' : 'destructive'}>
                          {(claim as any).Identity_Verification_Status}
                        </Badge>
                      </div>
                      {(claim as any).Identity_Score && (
                        <div className="flex justify-between">
                          <span className="text-sm">Identity Score:</span>
                          <span className="text-sm font-medium">{(claim as any).Identity_Score}%</span>
                        </div>
                      )}
                      {(claim as any).Document_Types_Provided && (
                        <div className="flex justify-between">
                          <span className="text-sm">Documents:</span>
                          <span className="text-sm">{(claim as any).Document_Types_Provided}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Employment & Claim Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Building className="h-5 w-5" />
                <span>Employment & Claim Details</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Employer</p>
                  <p className="font-medium">{claim.Employer_Name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Employment Status</p>
                  <p className="font-medium">{claim.Employment_Status}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Weekly Wage</p>
                    <p className="font-medium">${parseFloat(claim.Wage_Reported).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Claim Amount</p>
                    <p className="font-medium">${parseFloat(claim.Claim_Amount).toLocaleString()}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Claim Date</p>
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{claim.Claim_Date}</span>
                  </div>
                </div>
              </div>
              
              {claim.Justification_Text && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Justification</p>
                    <p className="text-sm bg-muted p-3 rounded-lg">
                      {claim.Justification_Text}
                    </p>
                  </div>
                </>
              )}
              
              {/* Enterprise Employment Data */}
              <Separator />
              <div>
                <p className="text-sm text-muted-foreground mb-2">Enterprise Risk Indicators</p>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {(claim as any).Employer_Risk_Score && (
                    <div className="flex justify-between">
                      <span>Employer Risk:</span>
                      <Badge variant={parseFloat((claim as any).Employer_Risk_Score) > 70 ? 'destructive' : 'secondary'}>
                        {(claim as any).Employer_Risk_Score}%
                      </Badge>
                    </div>
                  )}
                  {(claim as any).Geographic_Risk_Score && (
                    <div className="flex justify-between">
                      <span>Geographic Risk:</span>
                      <Badge variant={parseFloat((claim as any).Geographic_Risk_Score) > 70 ? 'destructive' : 'secondary'}>
                        {(claim as any).Geographic_Risk_Score}%
                      </Badge>
                    </div>
                  )}
                  {(claim as any).Employment_History_Verified && (
                    <div className="flex justify-between">
                      <span>Employment Verified:</span>
                      <Badge variant={(claim as any).Employment_History_Verified === 'YES' ? 'default' : 'destructive'}>
                        {(claim as any).Employment_History_Verified}
                      </Badge>
                    </div>
                  )}
                  {(claim as any).Address_Verification_Status && (
                    <div className="flex justify-between">
                      <span>Address Status:</span>
                      <Badge variant={(claim as any).Address_Verification_Status === 'VERIFIED' ? 'default' : 'destructive'}>
                        {(claim as any).Address_Verification_Status}
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Fraud Analysis */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5" />
                <span>Fraud Analysis</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Risk Score */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium">Risk Score</span>
                  <span className="text-lg font-bold">
                    {(claim.analysis.fraud_score * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-3">
                  <div 
                    className={`h-3 rounded-full transition-all ${
                      claim.analysis.fraud_score > 0.7 ? 'bg-red-500' :
                      claim.analysis.fraud_score > 0.5 ? 'bg-orange-500' :
                      claim.analysis.fraud_score > 0.3 ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${claim.analysis.fraud_score * 100}%` }}
                  />
                </div>
              </div>

              {/* Flags */}
              <div>
                <p className="text-sm font-medium mb-3">Fraud Flags ({claim.analysis.flags.length})</p>
                <div className="flex flex-wrap gap-2">
                  {claim.analysis.flags.map((flag, index) => (
                    <Badge key={index} variant="outline" className="border-orange-500/30 text-orange-400">
                      {flag}
                    </Badge>
                  ))}
                  {claim.analysis.flags.length === 0 && (
                    <p className="text-sm text-muted-foreground">No flags detected</p>
                  )}
                </div>
              </div>

              <Separator />

              {/* AI Explanation */}
              <div>
                <p className="text-sm font-medium mb-3">AI Analysis Explanation</p>
                <div className="bg-muted/50 p-4 rounded-lg">
                  <p className="text-sm leading-relaxed">{claim.analysis.explanation}</p>
                </div>
              </div>

              {/* Recommendation */}
              <div>
                <p className="text-sm font-medium mb-3">Recommended Action</p>
                <div className="bg-muted/50 p-4 rounded-lg">
                  <p className={`text-sm font-medium ${getRecommendationColor(claim.analysis.recommendation)}`}>
                    {claim.analysis.recommendation}
                  </p>
                </div>
              </div>

              {/* Analysis Metadata */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                <div>
                  <p className="text-sm text-muted-foreground">Confidence Level</p>
                  <p className="font-medium">{(claim.analysis.confidence * 100).toFixed(1)}%</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Analyzed At</p>
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      {new Date(claim.analysis.analyzed_at).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
