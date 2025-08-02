import {
  FraudCase,
  InvestigationNote,
  EvidenceItem,
  CustodyRecord,
  BenefitsClaim,
  ClaimantProfile,
  RiskAssessmentResult,
  AuditTrail,
  SystemAlert,
  CrossMatchResult
} from '@/types/enterprise';

export class CaseManagementService {
  private cases: Map<string, FraudCase> = new Map();
  private investigations: Map<string, InvestigationNote[]> = new Map();
  private evidence: Map<string, EvidenceItem[]> = new Map();
  private auditTrail: AuditTrail[] = [];
  private alerts: SystemAlert[] = [];

  async createFraudCase(
    riskAssessment: RiskAssessmentResult,
    claim: BenefitsClaim,
    claimant: ClaimantProfile,
    initiatedBy: string
  ): Promise<FraudCase> {
    const caseNumber = this.generateCaseNumber();
    const caseId = `CASE_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const fraudCase: FraudCase = {
      caseId,
      caseNumber,
      caseType: this.determineCaseType(riskAssessment),
      priority: this.determinePriority(riskAssessment.riskLevel),
      status: 'OPEN',
      claimantId: claimant.claimantId,
      relatedClaimIds: [claim.claimId],
      fraudScore: riskAssessment.overallRiskScore,
      potentialLoss: this.calculatePotentialLoss(claim),
      actualLoss: 0,
      recoveredAmount: 0,
      assignedInvestigator: await this.assignInvestigator(riskAssessment.riskLevel),
      createdDate: new Date().toISOString(),
      lastUpdatedDate: new Date().toISOString(),
      investigationNotes: [],
      evidenceItems: [],
      businessRulesTriggered: []
    };

    // Store case
    this.cases.set(caseId, fraudCase);
    this.investigations.set(caseId, []);
    this.evidence.set(caseId, []);

    // Create initial investigation note
    await this.addInvestigationNote(
      caseId,
      'SYSTEM',
      'GENERAL',
      `Case created automatically based on risk assessment. Risk Level: ${riskAssessment.riskLevel}, Score: ${riskAssessment.overallRiskScore}`,
      false
    );

    // Create audit trail entry
    this.addAuditEntry({
      auditId: `AUDIT_${Date.now()}`,
      entityType: 'CASE',
      entityId: caseId,
      action: 'CREATE',
      userId: initiatedBy,
      userName: 'SYSTEM',
      userRole: 'FRAUD_DETECTION_SYSTEM',
      timestamp: new Date().toISOString(),
      ipAddress: '127.0.0.1',
      newValues: fraudCase,
      systemGenerated: true
    });

    // Generate alert for high-priority cases
    if (fraudCase.priority === 'HIGH' || fraudCase.priority === 'CRITICAL') {
      await this.createSystemAlert({
        alertType: 'FRAUD_THRESHOLD',
        severity: fraudCase.priority === 'CRITICAL' ? 'CRITICAL' : 'HIGH',
        title: 'High-Risk Fraud Case Created',
        description: `New fraud case ${caseNumber} created with ${fraudCase.priority} priority`,
        entityType: 'CASE',
        entityId: caseId,
        triggeredBy: initiatedBy,
        metadata: {
          fraudScore: fraudCase.fraudScore,
          riskLevel: riskAssessment.riskLevel,
          potentialLoss: fraudCase.potentialLoss
        }
      });
    }

    return fraudCase;
  }

  async updateCaseStatus(
    caseId: string,
    newStatus: FraudCase['status'],
    updatedBy: string,
    reason?: string
  ): Promise<boolean> {
    const fraudCase = this.cases.get(caseId);
    if (!fraudCase) return false;

    const oldStatus = fraudCase.status;
    fraudCase.status = newStatus;
    fraudCase.lastUpdatedDate = new Date().toISOString();

    if (newStatus === 'CLOSED') {
      fraudCase.closureDate = new Date().toISOString();
      fraudCase.closureReason = reason;
    }

    // Add investigation note about status change
    await this.addInvestigationNote(
      caseId,
      updatedBy,
      'DECISION',
      `Case status changed from ${oldStatus} to ${newStatus}${reason ? `. Reason: ${reason}` : ''}`,
      false
    );

    // Create audit trail
    this.addAuditEntry({
      auditId: `AUDIT_${Date.now()}`,
      entityType: 'CASE',
      entityId: caseId,
      action: 'UPDATE',
      userId: updatedBy,
      userName: updatedBy,
      userRole: 'INVESTIGATOR',
      timestamp: new Date().toISOString(),
      ipAddress: '192.168.1.100',
      oldValues: { status: oldStatus },
      newValues: { status: newStatus },
      reason,
      systemGenerated: false
    });

    return true;
  }

  async addInvestigationNote(
    caseId: string,
    investigatorId: string,
    noteType: InvestigationNote['noteType'],
    content: string,
    isConfidential: boolean
  ): Promise<string> {
    const noteId = `NOTE_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    
    const note: InvestigationNote = {
      noteId,
      caseId,
      investigatorId,
      noteType,
      content,
      isConfidential,
      createdDate: new Date().toISOString(),
      lastModifiedDate: new Date().toISOString()
    };

    const notes = this.investigations.get(caseId) || [];
    notes.push(note);
    this.investigations.set(caseId, notes);

    // Update case
    const fraudCase = this.cases.get(caseId);
    if (fraudCase) {
      fraudCase.investigationNotes.push(note);
      fraudCase.lastUpdatedDate = new Date().toISOString();
    }

    return noteId;
  }

  async addEvidence(
    caseId: string,
    evidenceType: EvidenceItem['evidenceType'],
    description: string,
    collectedBy: string,
    filePath?: string,
    sourceSystem?: string
  ): Promise<string> {
    const evidenceId = `EVID_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    
    const evidenceItem: EvidenceItem = {
      evidenceId,
      caseId,
      evidenceType,
      description,
      filePath,
      sourceSystem,
      collectedBy,
      collectedDate: new Date().toISOString(),
      chainOfCustody: [{
        recordId: `CUST_${Date.now()}`,
        evidenceId,
        custodian: collectedBy,
        transferDate: new Date().toISOString(),
        transferReason: 'Initial collection',
        digitallySigned: true
      }]
    };

    const evidenceList = this.evidence.get(caseId) || [];
    evidenceList.push(evidenceItem);
    this.evidence.set(caseId, evidenceList);

    // Update case
    const fraudCase = this.cases.get(caseId);
    if (fraudCase) {
      fraudCase.evidenceItems.push(evidenceItem);
      fraudCase.lastUpdatedDate = new Date().toISOString();
    }

    // Add investigation note
    await this.addInvestigationNote(
      caseId,
      collectedBy,
      'EVIDENCE',
      `Evidence collected: ${evidenceType} - ${description}`,
      false
    );

    return evidenceId;
  }

  async performCrossMatch(claimantId: string): Promise<CrossMatchResult[]> {
    // Mock cross-matching against various databases
    const results: CrossMatchResult[] = [];

    // Simulate various types of matches
    const matchTypes = [
      { sourceType: 'SSN' as const, matchType: 'EXACT' as const, confidence: 0.99 },
      { sourceType: 'NAME' as const, matchType: 'FUZZY' as const, confidence: 0.85 },
      { sourceType: 'ADDRESS' as const, matchType: 'EXACT' as const, confidence: 0.95 }
    ];

    for (const match of matchTypes) {
      if (Math.random() > 0.7) { // 30% chance of match
        results.push({
          matchId: `MATCH_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          sourceType: match.sourceType,
          sourceValue: `MASKED_${match.sourceType}`,
          matchType: match.matchType,
          matchConfidence: match.confidence,
          relatedEntities: this.generateRelatedEntities(),
          riskImplications: this.generateRiskImplications(match.sourceType),
          identifiedDate: new Date().toISOString()
        });
      }
    }

    return results;
  }

  async assignInvestigator(riskLevel: string): Promise<string | undefined> {
    // Mock investigator assignment based on workload and expertise
    const investigators = {
      'LOW': ['INV_001', 'INV_002', 'INV_003'],
      'MEDIUM': ['INV_004', 'INV_005', 'INV_006'],
      'HIGH': ['INV_007', 'INV_008'],
      'CRITICAL': ['INV_009', 'INV_010'] // Senior investigators
    };

    const availableInvestigators = investigators[riskLevel as keyof typeof investigators] || investigators['MEDIUM'];
    return availableInvestigators[Math.floor(Math.random() * availableInvestigators.length)];
  }

  async createSystemAlert(alertData: Omit<SystemAlert, 'alertId' | 'triggeredDate' | 'status'>): Promise<string> {
    const alertId = `ALERT_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    
    const alert: SystemAlert = {
      alertId,
      ...alertData,
      triggeredDate: new Date().toISOString(),
      status: 'OPEN'
    };

    this.alerts.push(alert);
    return alertId;
  }

  async getCasesByStatus(status: FraudCase['status']): Promise<FraudCase[]> {
    return Array.from(this.cases.values()).filter(c => c.status === status);
  }

  async getCasesByInvestigator(investigatorId: string): Promise<FraudCase[]> {
    return Array.from(this.cases.values()).filter(c => c.assignedInvestigator === investigatorId);
  }

  async getHighPriorityCases(): Promise<FraudCase[]> {
    return Array.from(this.cases.values())
      .filter(c => c.priority === 'HIGH' || c.priority === 'CRITICAL')
      .sort((a, b) => {
        const priorityOrder = { 'CRITICAL': 4, 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 };
        return priorityOrder[b.priority as keyof typeof priorityOrder] - priorityOrder[a.priority as keyof typeof priorityOrder];
      });
  }

  async generateCaseReport(caseId: string): Promise<any> {
    const fraudCase = this.cases.get(caseId);
    if (!fraudCase) return null;

    const notes = this.investigations.get(caseId) || [];
    const evidenceList = this.evidence.get(caseId) || [];
    const auditEntries = this.auditTrail.filter(a => a.entityId === caseId);

    return {
      case: fraudCase,
      investigationSummary: {
        totalNotes: notes.length,
        evidenceCount: evidenceList.length,
        timelineEvents: auditEntries.length,
        daysOpen: Math.floor((Date.now() - new Date(fraudCase.createdDate).getTime()) / (1000 * 60 * 60 * 24))
      },
      investigationNotes: notes,
      evidence: evidenceList,
      auditTrail: auditEntries,
      recommendations: this.generateCaseRecommendations(fraudCase)
    };
  }

  private generateCaseNumber(): string {
    const year = new Date().getFullYear();
    const sequence = Math.floor(Math.random() * 999999).toString().padStart(6, '0');
    return `FC${year}${sequence}`;
  }

  private determineCaseType(riskAssessment: RiskAssessmentResult): FraudCase['caseType'] {
    const riskFactors = riskAssessment.riskFactors;
    
    if (riskFactors.some(f => f.factorName.includes('Deceased') || f.factorName.includes('Identity'))) {
      return 'IDENTITY_THEFT';
    }
    if (riskFactors.some(f => f.factorName.includes('Wage') || f.factorName.includes('Employment'))) {
      return 'WAGE_FALSIFICATION';
    }
    if (riskFactors.some(f => f.factorName.includes('Employer'))) {
      return 'EMPLOYER_FRAUD';
    }
    if (riskFactors.some(f => f.factorName.includes('Multiple') || f.factorName.includes('Pattern'))) {
      return 'ORGANIZED_FRAUD';
    }
    
    return 'ELIGIBILITY_FRAUD';
  }

  private determinePriority(riskLevel: string): FraudCase['priority'] {
    switch (riskLevel) {
      case 'CRITICAL': return 'CRITICAL';
      case 'HIGH': return 'HIGH';
      case 'MEDIUM': return 'MEDIUM';
      default: return 'LOW';
    }
  }

  private calculatePotentialLoss(claim: BenefitsClaim): number {
    // Calculate potential loss based on claim amount and duration
    const weeklyAmount = claim.weeklyBenefitAmount;
    const maxWeeks = 26; // Standard UI duration
    return weeklyAmount * maxWeeks;
  }

  private generateRelatedEntities(): any[] {
    // Mock related entities
    return [
      {
        entityType: 'CLAIMANT',
        entityId: `CLM_${Math.random().toString(36).substr(2, 8)}`,
        relationshipType: 'SAME_ADDRESS',
        strength: 0.8,
        lastActivity: new Date().toISOString()
      }
    ];
  }

  private generateRiskImplications(sourceType: string): string[] {
    const implications = {
      'SSN': ['Identity theft risk', 'Multiple claim fraud'],
      'NAME': ['Related party fraud', 'Organized fraud ring'],
      'ADDRESS': ['Address farming', 'Mail fraud scheme'],
      'PHONE': ['Contact fraud', 'Phone number sharing'],
      'EMAIL': ['Account takeover', 'Email fraud pattern']
    };
    
    return implications[sourceType as keyof typeof implications] || ['Unknown risk pattern'];
  }

  private generateCaseRecommendations(fraudCase: FraudCase): string[] {
    const recommendations: string[] = [];
    
    if (fraudCase.status === 'OPEN' && fraudCase.priority === 'CRITICAL') {
      recommendations.push('Immediate investigation required within 24 hours');
      recommendations.push('Contact law enforcement if criminal activity suspected');
    }
    
    if (fraudCase.fraudScore > 150) {
      recommendations.push('Deny all related claims pending investigation');
      recommendations.push('Flag claimant account for enhanced monitoring');
    }
    
    if (fraudCase.potentialLoss > 50000) {
      recommendations.push('Escalate to senior investigator');
      recommendations.push('Consider civil recovery proceedings');
    }
    
    return recommendations;
  }

  private addAuditEntry(entry: AuditTrail): void {
    this.auditTrail.push(entry);
  }

  // Getter methods for testing and monitoring
  getAllCases(): FraudCase[] {
    return Array.from(this.cases.values());
  }

  getAuditTrail(): AuditTrail[] {
    return [...this.auditTrail];
  }

  getAlerts(): SystemAlert[] {
    return [...this.alerts];
  }
}