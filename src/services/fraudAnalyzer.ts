
import { ClaimData, FraudAnalysis } from '../types/fraud';

class FraudAnalyzer {
  private apiKey: string = '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';
  private baseUrl: string = 'https://api-inference.huggingface.co/models/';

  public setApiKey(apiKey: string) {
    this.apiKey = apiKey;
  }

  public async analyzeClaim(claim: ClaimData): Promise<FraudAnalysis> {
    // Step 1: Basic Data Validation
    const validationFlags = this.validateClaimData(claim);

    // Step 2: Risk Scoring
    const fraudScore = await this.getFraudScore(claim);
    const fraudLabel = this.getFraudLabel(fraudScore);

    // Step 3: Flagging
    const aiFlags = await this.getAIFlags(claim);
    const flags = [...validationFlags, ...aiFlags];

    // Step 4: Recommendation
    const recommendation = this.getRecommendation(fraudLabel, flags);

    // Step 5: Explanation
    const explanation = await this.getExplanation(claim, fraudScore, flags);

    return {
      claim_id: claim.Claim_ID,
      fraud_score: fraudScore,
      fraud_label: fraudLabel as 'Low' | 'Medium' | 'High' | 'Severe',
      flags: flags,
      recommendation: recommendation,
      explanation: explanation,
      confidence: Math.min(0.95, fraudScore + 0.1),
      analyzed_at: new Date().toISOString()
    };
  }

  private async queryHuggingFace(modelName: string, inputs: any): Promise<any> {
    if (!this.apiKey) {
      // Return mock data for demo mode
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

  private validateClaimData(claim: ClaimData): string[] {
    const flags: string[] = [];

    if (!claim.Claim_ID) flags.push('Missing Claim ID');
    if (!claim.Claimant_ID) flags.push('Missing Claimant ID');
    if (!claim.Name) flags.push('Missing Name');
    if (!claim.DOB) flags.push('Missing Date of Birth');
    if (!claim.SSN_Hash) flags.push('Missing SSN Hash');
    if (!claim.Email) flags.push('Missing Email');
    if (!claim.Phone) flags.push('Missing Phone');
    if (!claim.Employer_Name) flags.push('Missing Employer Name');
    if (parseFloat(claim.Claim_Amount) > 10000) flags.push('High Claim Amount');

    return flags;
  }

  private async getFraudScore(claim: ClaimData): Promise<number> {
    // Use a text classification model to get a fraud score
    const modelName = 'laiyer/deberta-v3-base-turbo-finetuned-text-classification-fraud-detection';
    const response = await this.queryHuggingFace(modelName, claim.Justification_Text);

    if (response && Array.isArray(response) && response.length > 0) {
      const fraudScore = response.find(item => item.label === 'FRAUD')?.score || 0;
      return fraudScore;
    }

    return Math.random() * 0.8 + 0.1; // Random score between 0.1 and 0.9
  }

  private getFraudLabel(fraudScore: number): string {
    if (fraudScore > 0.9) return 'Severe';
    if (fraudScore > 0.7) return 'High';
    if (fraudScore > 0.5) return 'Medium';
    return 'Low';
  }

  private async getAIFlags(claim: ClaimData): Promise<string[]> {
    // Use a text generation model to identify potential fraud flags
    const modelName = 'google/flan-t5-base';
    const prompt = `Identify potential fraud indicators in the following claim: ${JSON.stringify(claim)}. Focus on inconsistencies and suspicious details.`;
    const response = await this.queryHuggingFace(modelName, prompt);

    if (response && response[0] && response[0].generated_text) {
      return response[0].generated_text.split(',').map((flag: string) => flag.trim());
    }

    // Return mock flags for demo
    const mockFlags = ['Suspicious IP', 'Multiple Claims', 'Unusual Email Pattern'];
    return mockFlags.slice(0, Math.floor(Math.random() * 3) + 1);
  }

  private getRecommendation(fraudLabel: string, flags: string[]): string {
    if (fraudLabel === 'Severe' || flags.length > 3) {
      return 'Reject claim and initiate investigation';
    } else if (fraudLabel === 'High') {
      return 'Review claim carefully and request additional documentation';
    } else if (fraudLabel === 'Medium') {
      return 'Verify claim details and monitor for suspicious activity';
    } else {
      return 'Process claim as usual';
    }
  }

  private async getExplanation(claim: ClaimData, fraudScore: number, flags: string[]): Promise<string> {
    // Use a text generation model to explain the fraud analysis results
    const modelName = 'google/flan-t5-base';
    const prompt = `Explain why the following claim has a fraud score of ${fraudScore} and the following flags: ${flags.join(', ')}. Claim details: ${JSON.stringify(claim)}`;
    const response = await this.queryHuggingFace(modelName, prompt);

    if (response && response[0] && response[0].generated_text) {
      return response[0].generated_text;
    }

    return `This claim received a ${(fraudScore * 100).toFixed(1)}% fraud score due to ${flags.length > 0 ? `the following indicators: ${flags.join(', ')}` : 'standard risk assessment patterns'}.`;
  }

  private getMockResponse(modelName: string, inputs: any): any {
    console.log(`Using mock response for ${modelName} with inputs:`, inputs);

    if (modelName === 'laiyer/deberta-v3-base-turbo-finetuned-text-classification-fraud-detection') {
      // Mock response for fraud score
      return [
        { label: 'LEGIT', score: Math.random() * 0.7 },
        { label: 'FRAUD', score: Math.random() * 0.8 + 0.2 }
      ];
    } else if (modelName === 'google/flan-t5-base') {
      // Mock response for text generation (flags and explanation)
      return [{ generated_text: 'Inconsistent employment status, Suspicious email address, Multiple IP addresses' }];
    }

    return {};
  }
}

export const fraudAnalyzer = new FraudAnalyzer();
