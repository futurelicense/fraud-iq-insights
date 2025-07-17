import { ClaimData } from '../types/fraud';

interface FraudAnalysisResult {
  fraud_score: number;
  fraud_label: string;
  flags: string[];
  recommendation: string;
  explanation: string;
}

class FraudAnalyzer {
  private apiKey: string = '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';
  private baseUrl: string = 'https://api-inference.huggingface.co/models/';

  public setApiKey(apiKey: string) {
    this.apiKey = apiKey;
  }

  public async analyzeClaim(claim: ClaimData): Promise<FraudAnalysisResult> {
    // Step 1: Basic Data Validation (Mock for now)
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
      fraud_score: fraudScore,
      fraud_label: fraudLabel,
      flags: flags,
      recommendation: recommendation,
      explanation: explanation
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

    return 0.5; // Default to medium risk if the API fails
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
      return response[0].generated_text.split(',').map(flag => flag.trim());
    }

    return [];
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

    return 'No explanation available';
  }

  private getMockResponse(modelName: string, inputs: any): any {
    console.log(`Using mock response for ${modelName} with inputs:`, inputs);

    if (modelName === 'laiyer/deberta-v3-base-turbo-finetuned-text-classification-fraud-detection') {
      // Mock response for fraud score
      return [
        { label: 'LEGIT', score: 0.2 },
        { label: 'FRAUD', score: 0.8 }
      ];
    } else if (modelName === 'google/flan-t5-base') {
      // Mock response for text generation (flags and explanation)
      return [{ generated_text: 'Inconsistent employment status, Suspicious email address' }];
    }

    return {};
  }
}

export const fraudAnalyzer = new FraudAnalyzer();
