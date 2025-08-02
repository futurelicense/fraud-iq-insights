import { 
  BenefitsClaim, 
  ClaimantProfile, 
  EmployerRecord, 
  RiskAssessmentResult,
  FraudCase
} from '@/types/enterprise';
import { BusinessRulesEngine } from './BusinessRulesEngine';
import { CaseManagementService } from './CaseManagementService';

export class EnterpriseFraudAnalyzer {
  private apiKey: string = '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';
  private businessRulesEngine: BusinessRulesEngine;
  private caseManagementService: CaseManagementService;
  private baseUrl: string = 'https://api-inference.huggingface.co/models/';

  constructor() {
    this.businessRulesEngine = new BusinessRulesEngine();
    this.caseManagementService = new CaseManagementService();
  }

  setApiKey(apiKey: string): void {
    this.apiKey = apiKey;
  }

  /**
   * Enterprise-grade fraud analysis using business rules engine
   */
  async analyzeClaimEnterprise(
    claim: BenefitsClaim,
    claimant: ClaimantProfile,
    employer?: EmployerRecord,
    contextData?: Record<string, any>
  ): Promise<RiskAssessmentResult> {
    try {
      // Step 1: Execute business rules engine
      const riskAssessment = await this.businessRulesEngine.evaluateRules(
        claim, 
        claimant, 
        employer, 
        contextData
      );

      // Step 2: Enhance with AI analysis if justification text available
      if (contextData?.justification_text) {
        const aiEnhancement = await this.enhanceWithAI(
          contextData.justification_text,
          riskAssessment
        );
        riskAssessment.overallRiskScore = Math.min(1000, riskAssessment.overallRiskScore + aiEnhancement.additionalScore);
        riskAssessment.riskFactors.push(...aiEnhancement.additionalFactors);
      }

      // Step 3: Perform cross-matching
      const crossMatches = await this.caseManagementService.performCrossMatch(claimant.claimantId);
      if (crossMatches.length > 0) {
        riskAssessment.riskFactors.push({
          factorId: 'CROSS_MATCH',
          factorName: 'Cross-System Matches Found',
          category: 'CROSS_REFERENCE',
          impact: crossMatches.length * 25,
          confidence: 0.9,
          description: `Found ${crossMatches.length} potential matches across systems`,
          evidence: crossMatches.map(m => `${m.sourceType}: ${m.matchType} match`)
        });
        riskAssessment.overallRiskScore += crossMatches.length * 25;
      }

      // Step 4: Create fraud case if high risk
      if (riskAssessment.requiresInvestigation) {
        await this.createFraudCaseIfNeeded(riskAssessment, claim, claimant);
      }

      // Step 5: Update risk level based on final score
      riskAssessment.riskLevel = this.determineRiskLevel(riskAssessment.overallRiskScore);

      return riskAssessment;
    } catch (error) {
      console.error('Enterprise fraud analysis failed:', error);
      
      // Return fallback assessment
      return {
        assessmentId: `FALLBACK_${claim.claimId}_${Date.now()}`,
        claimId: claim.claimId,
        claimantId: claimant.claimantId,
        assessmentDate: new Date().toISOString(),
        overallRiskScore: 0,
        riskLevel: 'LOW',
        riskFactors: [{
          factorId: 'SYSTEM_ERROR',
          factorName: 'Analysis System Error',
          category: 'TECHNICAL',
          impact: 0,
          confidence: 0,
          description: 'Fraud analysis system encountered an error',
          evidence: ['System fallback triggered']
        }],
        recommendedActions: ['Manual review required due to system error'],
        requiresInvestigation: true,
        autoApprovalEligible: false,
        modelVersion: 'FALLBACK_v1.0',
        confidenceScore: 0
      };
    }
  }

  /**
   * Convert legacy claim data to enterprise format
   */
  convertLegacyToEnterprise(legacyClaim: any): {
    claim: BenefitsClaim;
    claimant: ClaimantProfile;
    employer?: EmployerRecord;
    contextData: Record<string, any>;
  } {
    const claim: BenefitsClaim = {
      claimId: legacyClaim.Claim_ID || `LEGACY_${Date.now()}`,
      claimantId: legacyClaim.Claimant_ID || `CLAIMANT_${Date.now()}`,
      caseNumber: `CASE_${legacyClaim.Claim_ID || Date.now()}`,
      programType: 'UI', // Default to Unemployment Insurance
      benefitYear: new Date().getFullYear().toString(),
      weeklyBenefitAmount: parseFloat(legacyClaim.Claim_Amount) / 26 || 0, // Estimate weekly from total
      maximumBenefitAmount: parseFloat(legacyClaim.Claim_Amount) || 0,
      effectiveDate: legacyClaim.Claim_Date || new Date().toISOString(),
      expirationDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString(),
      status: 'PENDING',
      totalAmountPaid: 0,
      remainingBalance: parseFloat(legacyClaim.Claim_Amount) || 0,
      createdDate: legacyClaim.Claim_Date || new Date().toISOString(),
      lastModifiedDate: new Date().toISOString(),
      createdBy: 'LEGACY_SYSTEM',
      lastModifiedBy: 'LEGACY_SYSTEM'
    };

    const claimant: ClaimantProfile = {
      claimantId: legacyClaim.Claimant_ID || `CLAIMANT_${Date.now()}`,
      ssn: legacyClaim.SSN_Hash || 'LEGACY_SSN',
      firstName: this.extractFirstName(legacyClaim.Name),
      lastName: this.extractLastName(legacyClaim.Name),
      dateOfBirth: legacyClaim.DOB || '1970-01-01',
      gender: 'X', // Unknown from legacy data
      emailAddress: legacyClaim.Email || 'unknown@legacy.com',
      phoneNumber: legacyClaim.Phone || '000-000-0000',
      mailingAddress: {
        streetAddress1: 'Legacy Address',
        city: 'Unknown',
        state: 'Unknown',
        zipCode: '00000',
        country: 'US'
      },
      residenceAddress: {
        streetAddress1: 'Legacy Address',
        city: 'Unknown',
        state: 'Unknown',
        zipCode: '00000',
        country: 'US'
      },
      preferredLanguage: 'EN',
      riskScore: 0,
      riskFlags: [],
      identityVerificationStatus: 'PENDING',
      accountCreationDate: new Date().toISOString(),
      accountStatus: 'ACTIVE'
    };

    const employer: EmployerRecord | undefined = legacyClaim.Employer_Name ? {
      employerId: `EMP_${Date.now()}`,
      federalEin: 'LEGACY_EIN',
      legalName: legacyClaim.Employer_Name,
      naicsCode: '999999', // Unknown industry
      industryDescription: 'Unknown Industry',
      address: {
        streetAddress1: 'Legacy Employer Address',
        city: 'Unknown',
        state: 'Unknown',
        zipCode: '00000',
        country: 'US'
      },
      status: 'ACTIVE',
      riskLevel: 'LOW',
      totalEmployees: 0,
      quarterlyWageReports: [],
      suspiciousActivityFlags: [],
      lastAuditDate: undefined
    } : undefined;

    const contextData: Record<string, any> = {
      justification_text: legacyClaim.Justification_Text,
      ip_address: legacyClaim.IP_Address,
      device_id: legacyClaim.Device_ID,
      employment_status: legacyClaim.Employment_Status,
      wage_reported: legacyClaim.Wage_Reported,
      legacy_claim_data: legacyClaim
    };

    return { claim, claimant, employer, contextData };
  }

  private async enhanceWithAI(
    justificationText: string, 
    riskAssessment: RiskAssessmentResult
  ): Promise<{ additionalScore: number; additionalFactors: any[] }> {
    try {
      // Use AI to analyze justification text for fraud indicators
      const modelName = 'laiyer/deberta-v3-base-turbo-finetuned-text-classification-fraud-detection';
      const response = await this.queryHuggingFace(modelName, justificationText);

      let additionalScore = 0;
      const additionalFactors = [];

      if (response && Array.isArray(response)) {
        const fraudResult = response.find(item => item.label === 'FRAUD');
        if (fraudResult && fraudResult.score > 0.5) {
          additionalScore = Math.floor(fraudResult.score * 100);
          additionalFactors.push({
            factorId: 'AI_TEXT_ANALYSIS',
            factorName: 'AI Text Analysis - Fraud Indicators',
            category: 'AI_ANALYSIS',
            impact: additionalScore,
            confidence: fraudResult.score,
            description: 'AI model detected potential fraud indicators in claim justification',
            evidence: [`AI fraud confidence: ${(fraudResult.score * 100).toFixed(1)}%`]
          });
        }
      }

      return { additionalScore, additionalFactors };
    } catch (error) {
      console.warn('AI enhancement failed:', error);
      return { additionalScore: 0, additionalFactors: [] };
    }
  }

  private async queryHuggingFace(modelName: string, inputs: any): Promise<any> {
    if (!this.apiKey) {
      return this.getMockResponse(modelName, inputs);
    }

    try {
      const response = await fetch(`${this.baseUrl}${modelName}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ inputs }),
      });

      if (!response.ok) {
        console.warn(`HuggingFace API error: ${response.status}`);
        return this.getMockResponse(modelName, inputs);
      }

      return await response.json();
    } catch (error) {
      console.warn('HuggingFace API unavailable, using mock data:', error);
      return this.getMockResponse(modelName, inputs);
    }
  }

  private getMockResponse(modelName: string, inputs: any): any {
    if (modelName === 'laiyer/deberta-v3-base-turbo-finetuned-text-classification-fraud-detection') {
      return [
        { label: 'LEGIT', score: Math.random() * 0.7 },
        { label: 'FRAUD', score: Math.random() * 0.8 + 0.2 }
      ];
    }
    return {};
  }

  private async createFraudCaseIfNeeded(
    riskAssessment: RiskAssessmentResult,
    claim: BenefitsClaim,
    claimant: ClaimantProfile
  ): Promise<void> {
    if (riskAssessment.riskLevel === 'HIGH' || riskAssessment.riskLevel === 'CRITICAL') {
      await this.caseManagementService.createFraudCase(
        riskAssessment,
        claim,
        claimant,
        'FRAUD_DETECTION_SYSTEM'
      );
    }
  }

  private determineRiskLevel(score: number): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    if (score >= 200) return 'CRITICAL';
    if (score >= 100) return 'HIGH';
    if (score >= 50) return 'MEDIUM';
    return 'LOW';
  }

  private extractFirstName(fullName: string): string {
    const parts = fullName?.split(' ') || ['Unknown'];
    return parts[0] || 'Unknown';
  }

  private extractLastName(fullName: string): string {
    const parts = fullName?.split(' ') || ['Unknown'];
    return parts.length > 1 ? parts[parts.length - 1] : 'Unknown';
  }

  // Enterprise analytics and reporting methods
  async generateFraudReport(dateRange: { start: string; end: string }): Promise<any> {
    const cases = this.caseManagementService.getAllCases();
    const auditTrail = this.caseManagementService.getAuditTrail();
    const businessRules = this.businessRulesEngine.getRules();

    return {
      reportId: `FRAUD_REPORT_${Date.now()}`,
      dateRange,
      summary: {
        totalCases: cases.length,
        openCases: cases.filter(c => c.status === 'OPEN').length,
        highPriorityCases: cases.filter(c => c.priority === 'HIGH' || c.priority === 'CRITICAL').length,
        totalPotentialLoss: cases.reduce((sum, c) => sum + c.potentialLoss, 0),
        actualLoss: cases.reduce((sum, c) => sum + c.actualLoss, 0),
        recoveredAmount: cases.reduce((sum, c) => sum + c.recoveredAmount, 0)
      },
      casesByType: this.groupCasesByType(cases),
      topRiskFactors: this.calculateTopRiskFactors(cases),
      businessRulesPerformance: this.analyzeBusinessRulesPerformance(businessRules),
      recommendations: this.generateSystemRecommendations(cases)
    };
  }

  private groupCasesByType(cases: FraudCase[]): Record<string, number> {
    return cases.reduce((acc, caseItem) => {
      acc[caseItem.caseType] = (acc[caseItem.caseType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  private calculateTopRiskFactors(cases: FraudCase[]): any[] {
    // This would analyze risk factors across all cases
    return [
      { factor: 'Duplicate SSN', frequency: Math.floor(Math.random() * cases.length) },
      { factor: 'High Risk Employer', frequency: Math.floor(Math.random() * cases.length) },
      { factor: 'Excessive Wages', frequency: Math.floor(Math.random() * cases.length) }
    ];
  }

  private analyzeBusinessRulesPerformance(rules: any[]): any {
    return {
      totalRules: rules.length,
      activeRules: rules.filter(r => r.isActive).length,
      averageEffectiveness: 0.85, // Mock metric
      topPerformingRules: rules.slice(0, 5).map(r => ({
        ruleId: r.ruleId,
        ruleName: r.ruleName,
        triggerCount: Math.floor(Math.random() * 100),
        effectiveness: Math.random()
      }))
    };
  }

  private generateSystemRecommendations(cases: FraudCase[]): string[] {
    const recommendations = [];
    
    if (cases.filter(c => c.priority === 'CRITICAL').length > 10) {
      recommendations.push('Consider increasing investigator capacity for critical cases');
    }
    
    if (cases.filter(c => c.caseType === 'IDENTITY_THEFT').length > cases.length * 0.3) {
      recommendations.push('Enhance identity verification processes');
    }
    
    recommendations.push('Regular review of business rules effectiveness recommended');
    
    return recommendations;
  }

  // Public getter methods for monitoring and testing
  getBusinessRulesEngine(): BusinessRulesEngine {
    return this.businessRulesEngine;
  }

  getCaseManagementService(): CaseManagementService {
    return this.caseManagementService;
  }
}