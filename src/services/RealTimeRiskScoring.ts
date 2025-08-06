import { BenefitsClaim, ClaimantProfile, RiskAssessmentResult } from '@/types/enterprise';

interface RiskPattern {
  id: string;
  name: string;
  weight: number;
  conditions: Array<(claim: BenefitsClaim, claimant: ClaimantProfile, context?: any) => boolean>;
  emergingThreat: boolean;
  lastSeen: string;
  frequency: number;
}

interface BehavioralMetrics {
  claimantId: string;
  sessionDuration: number;
  clickPatterns: number[];
  typingSpeed: number;
  deviceFingerprint: string;
  ipAddress: string;
  locationConsistency: number;
  timeOfDayPattern: number[];
}

export class RealTimeRiskScoring {
  private riskPatterns: RiskPattern[] = [];
  private behavioralProfiles: Map<string, BehavioralMetrics[]> = new Map();
  private emergingThreats: Set<string> = new Set();
  private continuousLearning: boolean = true;

  constructor() {
    this.initializeRiskPatterns();
    this.startContinuousLearning();
  }

  private initializeRiskPatterns(): void {
    this.riskPatterns = [
      {
        id: 'RAPID_MULTIPLE_CLAIMS',
        name: 'Rapid Multiple Claims Pattern',
        weight: 85,
        conditions: [
          (claim, claimant, context) => {
            const recentClaims = context?.recentClaims || [];
            return recentClaims.filter((c: any) => 
              new Date(c.createdDate).getTime() > Date.now() - 24 * 60 * 60 * 1000
            ).length > 2;
          }
        ],
        emergingThreat: false,
        lastSeen: new Date().toISOString(),
        frequency: 45
      },
      {
        id: 'SUSPICIOUS_DEVICE_PATTERN',
        name: 'Suspicious Device Behavior',
        weight: 70,
        conditions: [
          (claim, claimant, context) => {
            const deviceMetrics = context?.deviceMetrics;
            return deviceMetrics?.unusualBehavior > 0.7;
          }
        ],
        emergingThreat: true,
        lastSeen: new Date().toISOString(),
        frequency: 23
      },
      {
        id: 'SYNTHETIC_IDENTITY_MARKERS',
        name: 'Synthetic Identity Indicators',
        weight: 95,
        conditions: [
          (claim, claimant, context) => {
            const identityScore = context?.identityVerification?.syntheticScore || 0;
            return identityScore > 0.8;
          }
        ],
        emergingThreat: true,
        lastSeen: new Date().toISOString(),
        frequency: 12
      },
      {
        id: 'GEOGRAPHIC_ANOMALY',
        name: 'Geographic Inconsistency',
        weight: 60,
        conditions: [
          (claim, claimant, context) => {
            const currentLocation = context?.currentLocation;
            const historicalLocations = context?.historicalLocations || [];
            if (!currentLocation || historicalLocations.length === 0) return false;
            
            const averageDistance = historicalLocations.reduce((sum: number, loc: any) => 
              sum + this.calculateDistance(currentLocation, loc), 0) / historicalLocations.length;
            
            return averageDistance > 500; // More than 500 miles from average
          }
        ],
        emergingThreat: false,
        lastSeen: new Date().toISOString(),
        frequency: 34
      }
    ];
  }

  /**
   * Real-time risk scoring with continuous learning
   */
  async scoreRiskRealTime(
    claim: BenefitsClaim,
    claimant: ClaimantProfile,
    context?: any
  ): Promise<RiskAssessmentResult> {
    const startTime = Date.now();
    
    // Get behavioral metrics
    const behavioralRisk = await this.analyzeBehavioralPatterns(claimant.claimantId, context);
    
    // Pattern matching with emerging threat detection
    const patternRisk = this.detectPatterns(claim, claimant, context);
    
    // Anomaly detection
    const anomalyRisk = await this.detectAnomalies(claim, claimant, context);
    
    // Continuous learning adjustment
    const learningAdjustment = this.applyContinuousLearning(claim, claimant, context);
    
    const baseScore = behavioralRisk + patternRisk + anomalyRisk + learningAdjustment;
    const finalScore = Math.min(1000, Math.max(0, baseScore));
    
    const processingTime = Date.now() - startTime;
    
    const riskFactors = this.generateRiskFactors(
      behavioralRisk, 
      patternRisk, 
      anomalyRisk, 
      learningAdjustment
    );

    return {
      assessmentId: `REALTIME_${claim.claimId}_${Date.now()}`,
      claimId: claim.claimId,
      claimantId: claimant.claimantId,
      assessmentDate: new Date().toISOString(),
      overallRiskScore: finalScore,
      riskLevel: this.determineRiskLevel(finalScore),
      riskFactors,
      recommendedActions: this.generateRecommendations(finalScore, riskFactors),
      requiresInvestigation: finalScore >= 100,
      autoApprovalEligible: finalScore < 50,
      modelVersion: 'REALTIME_v2.1',
      confidenceScore: this.calculateConfidence(riskFactors),
      processingTimeMs: processingTime,
      emergingThreats: Array.from(this.emergingThreats)
    };
  }

  private async analyzeBehavioralPatterns(
    claimantId: string, 
    context?: any
  ): Promise<number> {
    const currentMetrics = context?.behavioralMetrics;
    if (!currentMetrics) return 0;

    const historicalMetrics = this.behavioralProfiles.get(claimantId) || [];
    
    // Store current metrics for future learning
    historicalMetrics.push(currentMetrics);
    this.behavioralProfiles.set(claimantId, historicalMetrics.slice(-10)); // Keep last 10 sessions

    if (historicalMetrics.length < 2) return 0;

    let anomalyScore = 0;

    // Analyze typing speed variations
    const avgTypingSpeed = historicalMetrics.reduce((sum, m) => sum + m.typingSpeed, 0) / historicalMetrics.length;
    const typingDeviation = Math.abs(currentMetrics.typingSpeed - avgTypingSpeed) / avgTypingSpeed;
    if (typingDeviation > 0.5) anomalyScore += 25;

    // Analyze session duration patterns
    const avgSessionDuration = historicalMetrics.reduce((sum, m) => sum + m.sessionDuration, 0) / historicalMetrics.length;
    const durationDeviation = Math.abs(currentMetrics.sessionDuration - avgSessionDuration) / avgSessionDuration;
    if (durationDeviation > 0.7) anomalyScore += 20;

    // Device fingerprint consistency
    const uniqueFingerprints = new Set(historicalMetrics.map(m => m.deviceFingerprint));
    if (uniqueFingerprints.size > 3) anomalyScore += 30;

    // Location consistency
    if (currentMetrics.locationConsistency < 0.3) anomalyScore += 35;

    return anomalyScore;
  }

  private detectPatterns(
    claim: BenefitsClaim,
    claimant: ClaimantProfile,
    context?: any
  ): number {
    let patternScore = 0;

    for (const pattern of this.riskPatterns) {
      const matches = pattern.conditions.every(condition => 
        condition(claim, claimant, context)
      );

      if (matches) {
        patternScore += pattern.weight;
        
        // Mark as emerging threat if pattern frequency is increasing
        if (pattern.frequency > 20 && pattern.emergingThreat) {
          this.emergingThreats.add(pattern.id);
          patternScore += 20; // Additional score for emerging threats
        }
      }
    }

    return patternScore;
  }

  private async detectAnomalies(
    claim: BenefitsClaim,
    claimant: ClaimantProfile,
    context?: any
  ): Promise<number> {
    let anomalyScore = 0;

    // Time-based anomalies
    const claimHour = new Date(claim.createdDate).getHours();
    if (claimHour < 6 || claimHour > 22) anomalyScore += 15; // Unusual hours

    // Amount-based anomalies
    const avgBenefitAmount = 450; // Mock average
    const amountDeviation = Math.abs(claim.weeklyBenefitAmount - avgBenefitAmount) / avgBenefitAmount;
    if (amountDeviation > 1.5) anomalyScore += 25;

    // Identity verification anomalies
    if (claimant.riskScore > 70) anomalyScore += 30;

    // Cross-reference anomalies
    const crossRefFlags = context?.crossReferenceFlags || {};
    if (crossRefFlags.shared_address_count > 5) anomalyScore += 20;
    if (crossRefFlags.shared_phone_count > 3) anomalyScore += 15;

    return anomalyScore;
  }

  private applyContinuousLearning(
    claim: BenefitsClaim,
    claimant: ClaimantProfile,
    context?: any
  ): number {
    if (!this.continuousLearning) return 0;

    // Adjust scoring based on recent fraud confirmations
    const recentFraudConfirmations = context?.recentFraudConfirmations || [];
    const falsePositives = context?.recentFalsePositives || [];

    let adjustment = 0;

    // Learn from confirmed fraud cases
    recentFraudConfirmations.forEach((fraud: any) => {
      if (this.hasSimilarCharacteristics(claim, claimant, fraud)) {
        adjustment += 10;
      }
    });

    // Learn from false positives
    falsePositives.forEach((fp: any) => {
      if (this.hasSimilarCharacteristics(claim, claimant, fp)) {
        adjustment -= 5;
      }
    });

    return adjustment;
  }

  private hasSimilarCharacteristics(
    claim: BenefitsClaim,
    claimant: ClaimantProfile,
    reference: any
  ): boolean {
    // Simplified similarity check
    const amountSimilar = Math.abs(claim.weeklyBenefitAmount - reference.weeklyBenefitAmount) < 50;
    const riskSimilar = Math.abs(claimant.riskScore - reference.riskScore) < 20;
    
    return amountSimilar && riskSimilar;
  }

  private generateRiskFactors(
    behavioralRisk: number,
    patternRisk: number,
    anomalyRisk: number,
    learningAdjustment: number
  ): any[] {
    const factors = [];

    if (behavioralRisk > 20) {
      factors.push({
        factorId: 'BEHAVIORAL_ANOMALY',
        factorName: 'Behavioral Pattern Anomaly',
        category: 'BEHAVIORAL',
        impact: behavioralRisk,
        confidence: 0.85,
        description: 'Detected unusual user behavior patterns',
        evidence: ['Abnormal typing patterns', 'Session duration anomalies', 'Device inconsistencies']
      });
    }

    if (patternRisk > 30) {
      factors.push({
        factorId: 'PATTERN_MATCH',
        factorName: 'Known Fraud Pattern Detected',
        category: 'PATTERN_RECOGNITION',
        impact: patternRisk,
        confidence: 0.90,
        description: 'Matches known fraudulent behavior patterns',
        evidence: Array.from(this.emergingThreats).map(threat => `Pattern: ${threat}`)
      });
    }

    if (anomalyRisk > 25) {
      factors.push({
        factorId: 'STATISTICAL_ANOMALY',
        factorName: 'Statistical Anomaly Detected',
        category: 'ANOMALY_DETECTION',
        impact: anomalyRisk,
        confidence: 0.75,
        description: 'Deviates significantly from normal patterns',
        evidence: ['Unusual claim timing', 'Abnormal benefit amounts', 'Geographic inconsistencies']
      });
    }

    if (Math.abs(learningAdjustment) > 5) {
      factors.push({
        factorId: 'CONTINUOUS_LEARNING',
        factorName: 'Machine Learning Adjustment',
        category: 'AI_LEARNING',
        impact: learningAdjustment,
        confidence: 0.70,
        description: 'Risk score adjusted based on continuous learning',
        evidence: learningAdjustment > 0 ? 
          ['Similar to confirmed fraud cases'] : 
          ['Similar to confirmed legitimate cases']
      });
    }

    return factors;
  }

  private generateRecommendations(score: number, riskFactors: any[]): string[] {
    const recommendations = [];

    if (score >= 200) {
      recommendations.push('Immediate manual review required');
      recommendations.push('Escalate to senior fraud investigator');
    } else if (score >= 100) {
      recommendations.push('Schedule comprehensive investigation');
      recommendations.push('Request additional documentation');
    } else if (score >= 50) {
      recommendations.push('Perform enhanced verification checks');
      recommendations.push('Monitor for additional risk factors');
    }

    if (this.emergingThreats.size > 0) {
      recommendations.push('Alert: Emerging threat patterns detected');
    }

    if (riskFactors.some(f => f.category === 'BEHAVIORAL')) {
      recommendations.push('Consider behavioral biometric verification');
    }

    return recommendations;
  }

  private determineRiskLevel(score: number): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    if (score >= 200) return 'CRITICAL';
    if (score >= 100) return 'HIGH';
    if (score >= 50) return 'MEDIUM';
    return 'LOW';
  }

  private calculateConfidence(riskFactors: any[]): number {
    if (riskFactors.length === 0) return 0.5;
    
    const avgConfidence = riskFactors.reduce((sum, factor) => 
      sum + factor.confidence, 0) / riskFactors.length;
    
    return Math.round(avgConfidence * 100) / 100;
  }

  private calculateDistance(point1: any, point2: any): number {
    // Simplified distance calculation (Haversine formula would be more accurate)
    const latDiff = point1.lat - point2.lat;
    const lngDiff = point1.lng - point2.lng;
    return Math.sqrt(latDiff * latDiff + lngDiff * lngDiff) * 69; // Approximate miles
  }

  private startContinuousLearning(): void {
    // Simulate continuous learning updates
    setInterval(() => {
      this.updateEmergingThreats();
      this.adjustPatternWeights();
    }, 60000); // Update every minute
  }

  private updateEmergingThreats(): void {
    // Simulate threat intelligence updates
    this.riskPatterns.forEach(pattern => {
      pattern.frequency += Math.floor(Math.random() * 3);
      
      if (pattern.frequency > 30 && !pattern.emergingThreat) {
        pattern.emergingThreat = true;
        this.emergingThreats.add(pattern.id);
      }
    });
  }

  private adjustPatternWeights(): void {
    // Simulate weight adjustments based on effectiveness
    this.riskPatterns.forEach(pattern => {
      const effectiveness = Math.random();
      if (effectiveness > 0.8) {
        pattern.weight = Math.min(100, pattern.weight + 2);
      } else if (effectiveness < 0.3) {
        pattern.weight = Math.max(10, pattern.weight - 1);
      }
    });
  }

  // Public methods for monitoring and configuration
  getEmergingThreats(): string[] {
    return Array.from(this.emergingThreats);
  }

  getRiskPatterns(): RiskPattern[] {
    return [...this.riskPatterns];
  }

  addCustomPattern(pattern: Omit<RiskPattern, 'id' | 'lastSeen' | 'frequency'>): void {
    const newPattern: RiskPattern = {
      ...pattern,
      id: `CUSTOM_${Date.now()}`,
      lastSeen: new Date().toISOString(),
      frequency: 0
    };
    this.riskPatterns.push(newPattern);
  }

  toggleContinuousLearning(enabled: boolean): void {
    this.continuousLearning = enabled;
  }
}