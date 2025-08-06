import { BenefitsClaim, ClaimantProfile } from '@/types/enterprise';

interface FraudScheme {
  id: string;
  name: string;
  description: string;
  indicators: string[];
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  detectionRules: Array<(claims: BenefitsClaim[], claimants: ClaimantProfile[]) => boolean>;
  firstDetected: string;
  lastDetected: string;
  occurrenceCount: number;
  successRate: number;
}

interface PatternAlert {
  id: string;
  schemeId: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  message: string;
  affectedClaims: string[];
  detectedAt: string;
  confidence: number;
  actionRequired: string[];
}

export class PatternDetectionEngine {
  private knownSchemes: FraudScheme[] = [];
  private emergingPatterns: Map<string, any> = new Map();
  private alertHistory: PatternAlert[] = [];
  private isMonitoring: boolean = false;

  constructor() {
    this.initializeKnownSchemes();
    this.startPatternMonitoring();
  }

  private initializeKnownSchemes(): void {
    this.knownSchemes = [
      {
        id: 'IDENTITY_RING_SCHEME',
        name: 'Identity Theft Ring',
        description: 'Organized group using stolen identities to file fraudulent claims',
        indicators: [
          'Multiple claims from same IP address',
          'Similar personal information patterns',
          'Shared banking information',
          'Rapid claim filing sequences'
        ],
        severity: 'CRITICAL',
        detectionRules: [
          (claims, claimants) => {
            const ipGroups = this.groupBy(claims, 'ipAddress');
            return Object.values(ipGroups).some((group: any) => group.length > 5);
          },
          (claims, claimants) => {
            const ssnGroups = this.groupBy(claimants, 'ssn');
            return Object.values(ssnGroups).some((group: any) => group.length > 1);
          }
        ],
        firstDetected: '2024-01-15',
        lastDetected: new Date().toISOString(),
        occurrenceCount: 23,
        successRate: 0.87
      },
      {
        id: 'EMPLOYER_COLLUSION_SCHEME',
        name: 'Employer-Employee Collusion',
        description: 'Fraudulent separation agreements between employers and employees',
        indicators: [
          'High concentration of claims from specific employers',
          'Suspicious termination patterns',
          'Backdated employment records',
          'Wage inflation patterns'
        ],
        severity: 'HIGH',
        detectionRules: [
          (claims, claimants) => {
            const employerGroups = this.groupBy(claims, 'employerId');
            return Object.values(employerGroups).some((group: any) => 
              group.length > 10 && this.isWithinTimeWindow(group.map((c: any) => c.createdDate), 30)
            );
          }
        ],
        firstDetected: '2024-02-08',
        lastDetected: new Date().toISOString(),
        occurrenceCount: 15,
        successRate: 0.73
      },
      {
        id: 'SYNTHETIC_IDENTITY_SCHEME',
        name: 'Synthetic Identity Creation',
        description: 'Creating fake identities using real and fabricated information',
        indicators: [
          'Inconsistent identity verification scores',
          'New credit profiles with immediate benefit claims',
          'Manufactured personal histories',
          'Unusual demographic patterns'
        ],
        severity: 'CRITICAL',
        detectionRules: [
          (claims, claimants) => {
            return claimants.some(claimant => 
              claimant.riskScore > 80 && 
              new Date(claimant.accountCreationDate).getTime() > Date.now() - 30 * 24 * 60 * 60 * 1000
            );
          }
        ],
        firstDetected: '2024-03-12',
        lastDetected: new Date().toISOString(),
        occurrenceCount: 8,
        successRate: 0.95
      },
      {
        id: 'CROSS_BORDER_SCHEME',
        name: 'Cross-Border Fraud Network',
        description: 'International fraud network targeting multiple jurisdictions',
        indicators: [
          'Foreign IP addresses with local claims',
          'International banking connections',
          'Coordinated multi-state filing',
          'VPN usage patterns'
        ],
        severity: 'HIGH',
        detectionRules: [
          (claims, claimants) => {
            // Detect foreign IP patterns
            const foreignIPs = claims.filter(claim => 
              this.isNonDomesticIP(claim.ipAddress || '')
            );
            return foreignIPs.length > 3;
          }
        ],
        firstDetected: '2024-01-22',
        lastDetected: new Date().toISOString(),
        occurrenceCount: 12,
        successRate: 0.68
      },
      {
        id: 'AUTOMATED_FILING_SCHEME',
        name: 'Automated Claim Filing Bots',
        description: 'Automated systems filing large volumes of fraudulent claims',
        indicators: [
          'Rapid sequential claim filing',
          'Identical form filling patterns',
          'Bot-like interaction signatures',
          'Systematic data entry patterns'
        ],
        severity: 'MEDIUM',
        detectionRules: [
          (claims, claimants) => {
            const timeDiffs = claims
              .sort((a, b) => new Date(a.createdDate).getTime() - new Date(b.createdDate).getTime())
              .slice(0, -1)
              .map((claim, i) => 
                new Date(claims[i + 1].createdDate).getTime() - new Date(claim.createdDate).getTime()
              );
            
            // Detect suspiciously regular intervals (bot-like behavior)
            const avgInterval = timeDiffs.reduce((sum, diff) => sum + diff, 0) / timeDiffs.length;
            const variance = timeDiffs.reduce((sum, diff) => sum + Math.pow(diff - avgInterval, 2), 0) / timeDiffs.length;
            
            return variance < avgInterval * 0.1 && timeDiffs.length > 10; // Very low variance indicates bot
          }
        ],
        firstDetected: '2024-02-28',
        lastDetected: new Date().toISOString(),
        occurrenceCount: 6,
        successRate: 0.42
      }
    ];
  }

  /**
   * Detect emerging fraud schemes from current data
   */
  detectEmergingSchemes(
    claims: BenefitsClaim[], 
    claimants: ClaimantProfile[]
  ): PatternAlert[] {
    const alerts: PatternAlert[] = [];

    // Check for known schemes
    for (const scheme of this.knownSchemes) {
      const detection = this.detectScheme(scheme, claims, claimants);
      if (detection.detected) {
        alerts.push({
          id: `ALERT_${scheme.id}_${Date.now()}`,
          schemeId: scheme.id,
          severity: scheme.severity,
          message: `${scheme.name} detected: ${detection.description}`,
          affectedClaims: detection.affectedClaims,
          detectedAt: new Date().toISOString(),
          confidence: detection.confidence,
          actionRequired: this.generateActionItems(scheme)
        });

        // Update scheme statistics
        scheme.lastDetected = new Date().toISOString();
        scheme.occurrenceCount++;
      }
    }

    // Detect new emerging patterns
    const emergingAlerts = this.detectNewPatterns(claims, claimants);
    alerts.push(...emergingAlerts);

    // Store alerts for analysis
    this.alertHistory.push(...alerts);

    return alerts;
  }

  private detectScheme(
    scheme: FraudScheme, 
    claims: BenefitsClaim[], 
    claimants: ClaimantProfile[]
  ): { detected: boolean; description: string; affectedClaims: string[]; confidence: number } {
    const detectionResults = scheme.detectionRules.map(rule => rule(claims, claimants));
    const detected = detectionResults.every(result => result === true);
    
    if (!detected) {
      return { detected: false, description: '', affectedClaims: [], confidence: 0 };
    }

    const affectedClaims = this.identifyAffectedClaims(scheme, claims, claimants);
    const confidence = this.calculateDetectionConfidence(scheme, detectionResults.length);

    return {
      detected: true,
      description: `Detected ${affectedClaims.length} potentially fraudulent claims matching ${scheme.name} pattern`,
      affectedClaims,
      confidence
    };
  }

  private detectNewPatterns(
    claims: BenefitsClaim[], 
    claimants: ClaimantProfile[]
  ): PatternAlert[] {
    const alerts: PatternAlert[] = [];

    // Cluster analysis for new patterns
    const clusters = this.performClusterAnalysis(claims, claimants);
    
    for (const cluster of clusters) {
      if (cluster.suspiciousScore > 0.7 && cluster.members.length >= 5) {
        const patternId = `EMERGING_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Store as emerging pattern for further analysis
        this.emergingPatterns.set(patternId, {
          cluster,
          firstDetected: new Date().toISOString(),
          observations: 1
        });

        alerts.push({
          id: `ALERT_${patternId}`,
          schemeId: patternId,
          severity: cluster.suspiciousScore > 0.9 ? 'HIGH' : 'MEDIUM',
          message: `New emerging fraud pattern detected: ${cluster.description}`,
          affectedClaims: cluster.members.map(m => m.claimId),
          detectedAt: new Date().toISOString(),
          confidence: cluster.suspiciousScore,
          actionRequired: [
            'Investigate pattern for potential new fraud scheme',
            'Analyze common characteristics among flagged claims',
            'Consider creating new detection rules'
          ]
        });
      }
    }

    return alerts;
  }

  private performClusterAnalysis(
    claims: BenefitsClaim[], 
    claimants: ClaimantProfile[]
  ): Array<{ members: any[]; suspiciousScore: number; description: string }> {
    // Simplified clustering algorithm
    const clusters: Array<{ members: any[]; suspiciousScore: number; description: string }> = [];

    // IP address clustering
    const ipGroups = this.groupBy(claims, 'ipAddress');
    for (const [ip, claimGroup] of Object.entries(ipGroups)) {
      if ((claimGroup as any[]).length >= 3) {
        const suspiciousScore = Math.min(1, (claimGroup as any[]).length / 10);
        clusters.push({
          members: claimGroup as any[],
          suspiciousScore,
          description: `Multiple claims from IP address ${ip}`
        });
      }
    }

    // Temporal clustering (claims filed in suspicious time windows)
    const timeWindow = 3600000; // 1 hour
    const temporalClusters = this.groupByTimeWindow(claims, timeWindow);
    for (const cluster of temporalClusters) {
      if (cluster.length >= 5) {
        const suspiciousScore = Math.min(1, cluster.length / 20);
        clusters.push({
          members: cluster,
          suspiciousScore,
          description: `${cluster.length} claims filed within a short time window`
        });
      }
    }

    // Geographic clustering (same address patterns)
    const addressGroups = this.groupBy(claimants, c => 
      `${c.mailingAddress.streetAddress1}_${c.mailingAddress.city}_${c.mailingAddress.zipCode}`
    );
    for (const [address, claimantGroup] of Object.entries(addressGroups)) {
      if ((claimantGroup as any[]).length >= 4) {
        const relatedClaims = claims.filter(claim => 
          (claimantGroup as any[]).some(claimant => claimant.claimantId === claim.claimantId)
        );
        const suspiciousScore = Math.min(1, (claimantGroup as any[]).length / 8);
        clusters.push({
          members: relatedClaims,
          suspiciousScore,
          description: `Multiple claimants at same address: ${address.replace(/_/g, ', ')}`
        });
      }
    }

    return clusters;
  }

  private identifyAffectedClaims(
    scheme: FraudScheme, 
    claims: BenefitsClaim[], 
    claimants: ClaimantProfile[]
  ): string[] {
    // Simplified logic to identify which claims are affected by the scheme
    // In practice, this would be more sophisticated based on the specific scheme
    
    switch (scheme.id) {
      case 'IDENTITY_RING_SCHEME':
        const ipGroups = this.groupBy(claims, 'ipAddress');
        const suspiciousIPs = Object.entries(ipGroups)
          .filter(([_, group]) => (group as any[]).length > 5)
          .map(([ip, _]) => ip);
        return claims
          .filter(claim => suspiciousIPs.includes(claim.ipAddress || ''))
          .map(claim => claim.claimId);
          
      case 'EMPLOYER_COLLUSION_SCHEME':
        const employerGroups = this.groupBy(claims, 'employerId');
        const suspiciousEmployers = Object.entries(employerGroups)
          .filter(([_, group]) => (group as any[]).length > 10)
          .map(([employerId, _]) => employerId);
        return claims
          .filter(claim => suspiciousEmployers.includes(claim.employerId || ''))
          .map(claim => claim.claimId);
          
      default:
        return claims.slice(0, Math.min(10, claims.length)).map(claim => claim.claimId);
    }
  }

  private generateActionItems(scheme: FraudScheme): string[] {
    const baseActions = [
      'Flag all affected claims for manual review',
      'Notify fraud investigation team',
      'Document scheme characteristics for future detection'
    ];

    switch (scheme.severity) {
      case 'CRITICAL':
        return [
          'IMMEDIATE ACTION REQUIRED',
          'Escalate to senior management',
          'Consider law enforcement notification',
          ...baseActions,
          'Implement emergency countermeasures'
        ];
      case 'HIGH':
        return [
          'Urgent investigation required',
          'Review and strengthen related detection rules',
          ...baseActions,
          'Monitor for scheme expansion'
        ];
      case 'MEDIUM':
        return [
          'Schedule comprehensive review',
          ...baseActions,
          'Analyze scheme evolution patterns'
        ];
      default:
        return baseActions;
    }
  }

  private calculateDetectionConfidence(scheme: FraudScheme, rulesMatched: number): number {
    const baseConfidence = scheme.successRate;
    const ruleConfidence = rulesMatched / scheme.detectionRules.length;
    return Math.round((baseConfidence * 0.7 + ruleConfidence * 0.3) * 100) / 100;
  }

  private groupBy<T>(array: T[], key: keyof T | ((item: T) => string)): Record<string, T[]> {
    return array.reduce((groups, item) => {
      const groupKey = typeof key === 'function' ? key(item) : String(item[key]);
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(item);
      return groups;
    }, {} as Record<string, T[]>);
  }

  private groupByTimeWindow(claims: BenefitsClaim[], windowMs: number): BenefitsClaim[][] {
    const sorted = [...claims].sort((a, b) => 
      new Date(a.createdDate).getTime() - new Date(b.createdDate).getTime()
    );

    const clusters: BenefitsClaim[][] = [];
    let currentCluster: BenefitsClaim[] = [];
    let clusterStart = 0;

    for (const claim of sorted) {
      const claimTime = new Date(claim.createdDate).getTime();
      
      if (currentCluster.length === 0) {
        currentCluster = [claim];
        clusterStart = claimTime;
      } else if (claimTime - clusterStart <= windowMs) {
        currentCluster.push(claim);
      } else {
        if (currentCluster.length > 1) {
          clusters.push(currentCluster);
        }
        currentCluster = [claim];
        clusterStart = claimTime;
      }
    }

    if (currentCluster.length > 1) {
      clusters.push(currentCluster);
    }

    return clusters;
  }

  private isWithinTimeWindow(dates: string[], days: number): boolean {
    if (dates.length < 2) return false;
    
    const timestamps = dates.map(date => new Date(date).getTime());
    const minTime = Math.min(...timestamps);
    const maxTime = Math.max(...timestamps);
    
    return (maxTime - minTime) <= (days * 24 * 60 * 60 * 1000);
  }

  private isNonDomesticIP(ip: string): boolean {
    // Simplified check - in practice would use IP geolocation services
    return ip.startsWith('192.168.') || ip.startsWith('10.') || ip.startsWith('172.');
  }

  private startPatternMonitoring(): void {
    this.isMonitoring = true;
    
    // Simulate continuous monitoring
    setInterval(() => {
      this.updateSchemeStatistics();
      this.promoteEmergingPatterns();
    }, 300000); // Every 5 minutes
  }

  private updateSchemeStatistics(): void {
    // Update scheme effectiveness based on recent investigations
    this.knownSchemes.forEach(scheme => {
      // Simulate success rate adjustments based on investigation outcomes
      const randomAdjustment = (Math.random() - 0.5) * 0.02;
      scheme.successRate = Math.max(0.1, Math.min(0.99, scheme.successRate + randomAdjustment));
    });
  }

  private promoteEmergingPatterns(): void {
    // Check if emerging patterns should be promoted to known schemes
    for (const [patternId, pattern] of this.emergingPatterns.entries()) {
      pattern.observations++;
      
      if (pattern.observations >= 5 && pattern.cluster.suspiciousScore > 0.8) {
        // Promote to known scheme
        const newScheme: FraudScheme = {
          id: patternId,
          name: `Emerging Scheme ${patternId.split('_')[1]}`,
          description: pattern.cluster.description,
          indicators: ['Pattern detected through machine learning'],
          severity: pattern.cluster.suspiciousScore > 0.9 ? 'HIGH' : 'MEDIUM',
          detectionRules: [() => true], // Placeholder rule
          firstDetected: pattern.firstDetected,
          lastDetected: new Date().toISOString(),
          occurrenceCount: pattern.observations,
          successRate: 0.5 // Initial estimate
        };
        
        this.knownSchemes.push(newScheme);
        this.emergingPatterns.delete(patternId);
      }
    }
  }

  // Public interface methods
  getKnownSchemes(): FraudScheme[] {
    return [...this.knownSchemes];
  }

  getEmergingPatterns(): Array<{ id: string; pattern: any }> {
    return Array.from(this.emergingPatterns.entries()).map(([id, pattern]) => ({ id, pattern }));
  }

  getAlertHistory(): PatternAlert[] {
    return [...this.alertHistory];
  }

  addCustomScheme(scheme: Omit<FraudScheme, 'id' | 'firstDetected' | 'lastDetected' | 'occurrenceCount'>): void {
    const newScheme: FraudScheme = {
      ...scheme,
      id: `CUSTOM_${Date.now()}`,
      firstDetected: new Date().toISOString(),
      lastDetected: new Date().toISOString(),
      occurrenceCount: 0
    };
    this.knownSchemes.push(newScheme);
  }
}