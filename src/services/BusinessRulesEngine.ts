import { 
  BusinessRule, 
  RuleCondition, 
  RuleAction, 
  BusinessRuleTrigger, 
  BenefitsClaim, 
  ClaimantProfile, 
  EmployerRecord,
  RiskAssessmentResult,
  RiskFactor
} from '@/types/enterprise';

export class BusinessRulesEngine {
  private rules: BusinessRule[] = [];
  private auditLog: BusinessRuleTrigger[] = [];

  constructor() {
    this.initializeDefaultRules();
  }

  private initializeDefaultRules(): void {
    // Identity Verification Rules
    this.rules.push({
      ruleId: 'ID_001',
      ruleName: 'Duplicate SSN Check',
      ruleType: 'FLAGGING',
      category: 'IDENTITY',
      description: 'Flag claims with SSN already associated with active claim',
      conditions: [
        {
          conditionId: 'C001',
          fieldName: 'ssn_usage_count',
          operator: 'GREATER_THAN',
          value: 1
        }
      ],
      actions: [
        {
          actionId: 'A001',
          actionType: 'SET_FLAG',
          parameters: { flag: 'DUPLICATE_SSN', severity: 'HIGH' }
        },
        {
          actionId: 'A002',
          actionType: 'ADD_SCORE',
          parameters: { score: 75 }
        }
      ],
      severity: 'ERROR',
      isActive: true,
      effectiveDate: '2024-01-01',
      createdBy: 'SYSTEM',
      lastModifiedBy: 'SYSTEM',
      lastModifiedDate: new Date().toISOString()
    });

    // Wage Validation Rules
    this.rules.push({
      ruleId: 'WAGE_001',
      ruleName: 'Excessive Wage Claims',
      ruleType: 'SCORING',
      category: 'WAGE',
      description: 'High risk score for claims with wages significantly above industry average',
      conditions: [
        {
          conditionId: 'C002',
          fieldName: 'wage_to_industry_ratio',
          operator: 'GREATER_THAN',
          value: 2.5
        }
      ],
      actions: [
        {
          actionId: 'A003',
          actionType: 'ADD_SCORE',
          parameters: { score: 50 }
        },
        {
          actionId: 'A004',
          actionType: 'SET_FLAG',
          parameters: { flag: 'EXCESSIVE_WAGES', severity: 'MEDIUM' }
        }
      ],
      severity: 'WARNING',
      isActive: true,
      effectiveDate: '2024-01-01',
      createdBy: 'SYSTEM',
      lastModifiedBy: 'SYSTEM',
      lastModifiedDate: new Date().toISOString()
    });

    // Employer Verification Rules
    this.rules.push({
      ruleId: 'EMP_001',
      ruleName: 'High-Risk Employer',
      ruleType: 'BLOCKING',
      category: 'EMPLOYER',
      description: 'Block claims from employers flagged as high-risk',
      conditions: [
        {
          conditionId: 'C003',
          fieldName: 'employer_risk_level',
          operator: 'EQUALS',
          value: 'CRITICAL'
        }
      ],
      actions: [
        {
          actionId: 'A005',
          actionType: 'BLOCK_CLAIM',
          parameters: { reason: 'HIGH_RISK_EMPLOYER' }
        },
        {
          actionId: 'A006',
          actionType: 'CREATE_CASE',
          parameters: { caseType: 'EMPLOYER_FRAUD', priority: 'HIGH' }
        }
      ],
      severity: 'CRITICAL',
      isActive: true,
      effectiveDate: '2024-01-01',
      createdBy: 'SYSTEM',
      lastModifiedBy: 'SYSTEM',
      lastModifiedDate: new Date().toISOString()
    });

    // Behavioral Analysis Rules
    this.rules.push({
      ruleId: 'BEH_001',
      ruleName: 'Rapid Multiple Claims',
      ruleType: 'FLAGGING',
      category: 'BEHAVIORAL',
      description: 'Flag claimants filing multiple claims in short timeframe',
      conditions: [
        {
          conditionId: 'C004',
          fieldName: 'claims_last_30_days',
          operator: 'GREATER_THAN',
          value: 3
        }
      ],
      actions: [
        {
          actionId: 'A007',
          actionType: 'SET_FLAG',
          parameters: { flag: 'RAPID_FILING', severity: 'MEDIUM' }
        },
        {
          actionId: 'A008',
          actionType: 'REQUIRE_VERIFICATION',
          parameters: { verificationType: 'IDENTITY_ENHANCED' }
        }
      ],
      severity: 'WARNING',
      isActive: true,
      effectiveDate: '2024-01-01',
      createdBy: 'SYSTEM',
      lastModifiedBy: 'SYSTEM',
      lastModifiedDate: new Date().toISOString()
    });

    // Cross-Reference Rules
    this.rules.push({
      ruleId: 'XREF_001',
      ruleName: 'Deceased Person Check',
      ruleType: 'BLOCKING',
      category: 'CROSS_REFERENCE',
      description: 'Block claims from individuals in death registry',
      conditions: [
        {
          conditionId: 'C005',
          fieldName: 'death_registry_match',
          operator: 'EQUALS',
          value: true
        }
      ],
      actions: [
        {
          actionId: 'A009',
          actionType: 'BLOCK_CLAIM',
          parameters: { reason: 'DECEASED_PERSON' }
        },
        {
          actionId: 'A010',
          actionType: 'CREATE_CASE',
          parameters: { caseType: 'IDENTITY_THEFT', priority: 'CRITICAL' }
        }
      ],
      severity: 'CRITICAL',
      isActive: true,
      effectiveDate: '2024-01-01',
      createdBy: 'SYSTEM',
      lastModifiedBy: 'SYSTEM',
      lastModifiedDate: new Date().toISOString()
    });
  }

  async evaluateRules(
    claim: BenefitsClaim, 
    claimant: ClaimantProfile, 
    employer?: EmployerRecord,
    contextData?: Record<string, any>
  ): Promise<RiskAssessmentResult> {
    const triggeredRules: BusinessRuleTrigger[] = [];
    const riskFactors: RiskFactor[] = [];
    let totalRiskScore = 0;
    let shouldBlock = false;
    let requiresInvestigation = false;

    // Prepare evaluation context
    const evaluationContext = {
      ...contextData,
      claim,
      claimant,
      employer,
      // Add derived metrics
      ssn_usage_count: await this.getSSNUsageCount(claimant.ssn),
      wage_to_industry_ratio: await this.calculateWageToIndustryRatio(claim, employer),
      employer_risk_level: employer?.riskLevel || 'LOW',
      claims_last_30_days: await this.getClaimsLast30Days(claimant.claimantId),
      death_registry_match: await this.checkDeathRegistry(claimant.ssn)
    };

    // Evaluate each active rule
    for (const rule of this.rules.filter(r => r.isActive)) {
      const isTriggered = this.evaluateRuleConditions(rule.conditions, evaluationContext);
      
      if (isTriggered) {
        const trigger: BusinessRuleTrigger = {
          triggerId: `${rule.ruleId}_${Date.now()}`,
          ruleId: rule.ruleId,
          ruleName: rule.ruleName,
          claimId: claim.claimId,
          triggerDate: new Date().toISOString(),
          severity: rule.severity,
          message: this.generateRuleMessage(rule, evaluationContext),
          actionsTaken: [],
          dataSnapshot: { ...evaluationContext }
        };

        // Execute rule actions
        for (const action of rule.actions) {
          const actionResult = await this.executeRuleAction(action, evaluationContext);
          trigger.actionsTaken.push(actionResult.description);
          
          if (action.actionType === 'ADD_SCORE') {
            totalRiskScore += action.parameters.score || 0;
          } else if (action.actionType === 'BLOCK_CLAIM') {
            shouldBlock = true;
          } else if (action.actionType === 'CREATE_CASE' || action.actionType === 'REQUIRE_VERIFICATION') {
            requiresInvestigation = true;
          }
        }

        // Create risk factor
        riskFactors.push({
          factorId: rule.ruleId,
          factorName: rule.ruleName,
          category: rule.category,
          impact: this.calculateImpactScore(rule.severity),
          confidence: 0.95, // Business rules have high confidence
          description: rule.description,
          evidence: trigger.actionsTaken
        });

        triggeredRules.push(trigger);
        this.auditLog.push(trigger);
      }
    }

    // Determine risk level
    const riskLevel = this.determineRiskLevel(totalRiskScore, shouldBlock);
    
    // Generate recommendations
    const recommendedActions = this.generateRecommendations(
      riskLevel, 
      triggeredRules, 
      shouldBlock, 
      requiresInvestigation
    );

    return {
      assessmentId: `RISK_${claim.claimId}_${Date.now()}`,
      claimId: claim.claimId,
      claimantId: claimant.claimantId,
      assessmentDate: new Date().toISOString(),
      overallRiskScore: totalRiskScore,
      riskLevel,
      riskFactors,
      recommendedActions,
      requiresInvestigation,
      autoApprovalEligible: !shouldBlock && riskLevel === 'LOW',
      modelVersion: 'BRE_v2.1',
      confidenceScore: this.calculateOverallConfidence(riskFactors)
    };
  }

  private evaluateRuleConditions(conditions: RuleCondition[], context: Record<string, any>): boolean {
    // For simplicity, treating all conditions as AND logic
    // In enterprise system, would support complex logical expressions
    return conditions.every(condition => {
      const fieldValue = this.getFieldValue(condition.fieldName, context);
      return this.evaluateCondition(condition, fieldValue);
    });
  }

  private evaluateCondition(condition: RuleCondition, fieldValue: any): boolean {
    switch (condition.operator) {
      case 'EQUALS':
        return fieldValue === condition.value;
      case 'NOT_EQUALS':
        return fieldValue !== condition.value;
      case 'GREATER_THAN':
        return Number(fieldValue) > Number(condition.value);
      case 'LESS_THAN':
        return Number(fieldValue) < Number(condition.value);
      case 'CONTAINS':
        return String(fieldValue).includes(String(condition.value));
      case 'REGEX':
        return new RegExp(condition.value).test(String(fieldValue));
      case 'IN_LIST':
        return Array.isArray(condition.value) && condition.value.includes(fieldValue);
      case 'NOT_IN_LIST':
        return Array.isArray(condition.value) && !condition.value.includes(fieldValue);
      default:
        return false;
    }
  }

  private getFieldValue(fieldName: string, context: Record<string, any>): any {
    // Support nested field access
    const parts = fieldName.split('.');
    let value = context;
    for (const part of parts) {
      value = value?.[part];
    }
    return value;
  }

  private async executeRuleAction(action: RuleAction, context: Record<string, any>): Promise<{ description: string }> {
    switch (action.actionType) {
      case 'SET_FLAG':
        return { description: `Set flag: ${action.parameters.flag} (${action.parameters.severity})` };
      case 'ADD_SCORE':
        return { description: `Added risk score: ${action.parameters.score}` };
      case 'BLOCK_CLAIM':
        return { description: `Blocked claim: ${action.parameters.reason}` };
      case 'REQUIRE_VERIFICATION':
        return { description: `Required verification: ${action.parameters.verificationType}` };
      case 'CREATE_CASE':
        return { description: `Created case: ${action.parameters.caseType} (${action.parameters.priority})` };
      case 'SEND_ALERT':
        return { description: `Sent alert: ${action.parameters.alertType}` };
      default:
        return { description: `Unknown action: ${action.actionType}` };
    }
  }

  private generateRuleMessage(rule: BusinessRule, context: Record<string, any>): string {
    return `Rule "${rule.ruleName}" triggered: ${rule.description}`;
  }

  private calculateImpactScore(severity: string): number {
    switch (severity) {
      case 'CRITICAL': return 100;
      case 'ERROR': return 75;
      case 'WARNING': return 50;
      case 'INFO': return 25;
      default: return 0;
    }
  }

  private determineRiskLevel(score: number, shouldBlock: boolean): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    if (shouldBlock || score >= 200) return 'CRITICAL';
    if (score >= 100) return 'HIGH';
    if (score >= 50) return 'MEDIUM';
    return 'LOW';
  }

  private generateRecommendations(
    riskLevel: string, 
    triggeredRules: BusinessRuleTrigger[], 
    shouldBlock: boolean, 
    requiresInvestigation: boolean
  ): string[] {
    const recommendations: string[] = [];

    if (shouldBlock) {
      recommendations.push('DENY claim immediately due to critical risk factors');
    } else if (riskLevel === 'CRITICAL') {
      recommendations.push('HOLD claim for immediate investigation');
      recommendations.push('Require enhanced identity verification');
    } else if (riskLevel === 'HIGH') {
      recommendations.push('HOLD claim for standard investigation');
      recommendations.push('Verify employment and wage records');
    } else if (riskLevel === 'MEDIUM') {
      recommendations.push('Process with additional verification');
      recommendations.push('Monitor for unusual patterns');
    } else {
      recommendations.push('APPROVE with standard processing');
    }

    if (requiresInvestigation) {
      recommendations.push('Create investigation case');
      recommendations.push('Assign to fraud investigation unit');
    }

    return recommendations;
  }

  private calculateOverallConfidence(riskFactors: RiskFactor[]): number {
    if (riskFactors.length === 0) return 1.0;
    const avgConfidence = riskFactors.reduce((sum, factor) => sum + factor.confidence, 0) / riskFactors.length;
    return Math.round(avgConfidence * 100) / 100;
  }

  // Mock data access methods (in enterprise system, these would query actual databases)
  private async getSSNUsageCount(ssn: string): Promise<number> {
    // Mock: Check if SSN is used in multiple active claims
    return Math.random() > 0.9 ? Math.floor(Math.random() * 3) + 2 : 1;
  }

  private async calculateWageToIndustryRatio(claim: BenefitsClaim, employer?: EmployerRecord): Promise<number> {
    // Mock: Calculate ratio of reported wages to industry average
    const industryAverage = 50000; // Mock industry average
    const reportedWages = claim.weeklyBenefitAmount * 52; // Approximate annual
    return reportedWages / industryAverage;
  }

  private async getClaimsLast30Days(claimantId: string): Promise<number> {
    // Mock: Count claims filed by claimant in last 30 days
    return Math.random() > 0.95 ? Math.floor(Math.random() * 5) + 1 : 1;
  }

  private async checkDeathRegistry(ssn: string): Promise<boolean> {
    // Mock: Check death registry (DMF - Death Master File)
    return Math.random() > 0.999; // Very rare occurrence
  }

  // Administrative methods
  addRule(rule: BusinessRule): void {
    this.rules.push(rule);
  }

  updateRule(ruleId: string, updates: Partial<BusinessRule>): boolean {
    const index = this.rules.findIndex(r => r.ruleId === ruleId);
    if (index !== -1) {
      this.rules[index] = { ...this.rules[index], ...updates, lastModifiedDate: new Date().toISOString() };
      return true;
    }
    return false;
  }

  deactivateRule(ruleId: string): boolean {
    return this.updateRule(ruleId, { isActive: false });
  }

  getAuditLog(): BusinessRuleTrigger[] {
    return [...this.auditLog];
  }

  getRules(): BusinessRule[] {
    return [...this.rules];
  }
}