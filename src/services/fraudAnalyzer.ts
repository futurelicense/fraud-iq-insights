
import { ClaimData, FraudAnalysis } from '../types/fraud';

class FraudAnalyzer {
  private apiKey: string | null = null;

  setApiKey(key: string) {
    this.apiKey = key;
  }

  async analyzeClaim(claim: ClaimData): Promise<FraudAnalysis> {
    console.log('Analyzing claim:', claim.Claim_ID);
    
    try {
      // Simulate API delay for realistic feel
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
      
      // Calculate fraud score based on various factors
      const fraudScore = this.calculateFraudScore(claim);
      const fraudLabel = this.getFraudLabel(fraudScore);
      const flags = this.generateFlags(claim, fraudScore);
      const explanation = this.generateExplanation(claim, fraudScore, flags);
      const recommendation = this.generateRecommendation(fraudScore, flags);
      
      return {
        claim_id: claim.Claim_ID,
        fraud_score: fraudScore,
        fraud_label: fraudLabel,
        explanation,
        flags,
        recommendation,
        confidence: Math.min(0.95, 0.6 + (fraudScore * 0.4)),
        analyzed_at: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error analyzing claim:', error);
      throw new Error('Failed to analyze claim');
    }
  }

  private calculateFraudScore(claim: ClaimData): number {
    let score = 0.1; // Base score
    
    // Check for suspicious patterns
    const claimAmount = parseFloat(claim.Claim_Amount) || 0;
    const wageReported = parseFloat(claim.Wage_Reported) || 0;
    
    // High claim amount relative to wage
    if (claimAmount > wageReported * 4) {
      score += 0.3;
    }
    
    // Email domain analysis
    if (claim.Email.includes('tempmail') || claim.Email.includes('10minute')) {
      score += 0.4;
    }
    
    // Phone number patterns
    if (claim.Phone.includes('555') || claim.Phone.length < 10) {
      score += 0.2;
    }
    
    // IP address analysis (simplified)
    if (claim.IP_Address.startsWith('10.') || claim.IP_Address.includes('127.')) {
      score += 0.25;
    }
    
    // Employment status red flags
    if (claim.Employment_Status.toLowerCase().includes('terminated') && 
        claim.Justification_Text && claim.Justification_Text.length < 20) {
      score += 0.3;
    }
    
    // Random variation for demonstration
    score += Math.random() * 0.2;
    
    return Math.min(1.0, Math.max(0.0, score));
  }

  private getFraudLabel(score: number): 'Low' | 'Medium' | 'High' | 'Severe' {
    if (score < 0.3) return 'Low';
    if (score < 0.6) return 'Medium';
    if (score < 0.8) return 'High';
    return 'Severe';
  }

  private generateFlags(claim: ClaimData, score: number): string[] {
    const flags: string[] = [];
    
    if (score > 0.7) flags.push('High Risk Score');
    
    const claimAmount = parseFloat(claim.Claim_Amount) || 0;
    const wageReported = parseFloat(claim.Wage_Reported) || 0;
    
    if (claimAmount > wageReported * 4) {
      flags.push('Claim Amount Exceeds Expected Wage');
    }
    
    if (claim.Email.includes('tempmail') || claim.Email.includes('10minute')) {
      flags.push('Suspicious Email Domain');
    }
    
    if (claim.Phone.includes('555')) {
      flags.push('Invalid Phone Number Pattern');
    }
    
    if (claim.IP_Address.startsWith('10.') || claim.IP_Address.includes('127.')) {
      flags.push('Internal/Local IP Address');
    }
    
    if (!claim.Justification_Text || claim.Justification_Text.length < 10) {
      flags.push('Missing or Insufficient Justification');
    }
    
    // Add some variety
    if (score > 0.5 && Math.random() > 0.7) {
      flags.push('Multiple Claims from Same Device');
    }
    
    if (score > 0.6 && Math.random() > 0.8) {
      flags.push('Employer Information Inconsistency');
    }
    
    return flags;
  }

  private generateExplanation(claim: ClaimData, score: number, flags: string[]): string {
    const explanations = [
      `Claim ${claim.Claim_ID} has been flagged with a fraud score of ${(score * 100).toFixed(1)}%.`,
      flags.length > 0 ? `Key concerns include: ${flags.slice(0, 2).join(', ')}.` : '',
      score > 0.7 ? 'This claim requires immediate investigation.' : 
      score > 0.5 ? 'This claim should be reviewed for potential fraud indicators.' :
      'This claim appears to have minimal fraud risk.',
    ].filter(Boolean);
    
    return explanations.join(' ');
  }

  private generateRecommendation(score: number, flags: string[]): string {
    if (score > 0.8) return 'DENY - Immediate escalation to fraud investigation team';
    if (score > 0.6) return 'HOLD - Request additional documentation and identity verification';
    if (score > 0.4) return 'REVIEW - Secondary analyst review recommended';
    if (score > 0.2) return 'MONITOR - Approve with enhanced monitoring';
    return 'APPROVE - Standard processing';
  }

  async analyzeMultipleClaims(claims: ClaimData[]): Promise<FraudAnalysis[]> {
    const analyses: FraudAnalysis[] = [];
    
    for (const claim of claims) {
      const analysis = await this.analyzeClaim(claim);
      analyses.push(analysis);
    }
    
    return analyses;
  }
}

export const fraudAnalyzer = new FraudAnalyzer();
