
export interface ClaimData {
  Claim_ID: string;
  Claimant_ID: string;
  Name: string;
  DOB: string;
  SSN_Hash: string;
  Email: string;
  Phone: string;
  IP_Address: string;
  Device_ID: string;
  Employer_Name: string;
  Employment_Status: string;
  Wage_Reported: string;
  Claim_Amount: string;
  Claim_Date: string;
  Justification_Text?: string;
}

export interface FraudAnalysis {
  claim_id: string;
  fraud_score: number;
  fraud_label: 'Low' | 'Medium' | 'High' | 'Severe';
  explanation: string;
  flags: string[];
  recommendation: string;
  confidence: number;
  analyzed_at: string;
}

export interface AnalyzedClaim extends ClaimData {
  analysis: FraudAnalysis;
}

export interface DashboardStats {
  total_claims: number;
  low_risk: number;
  medium_risk: number;
  high_risk: number;
  severe_risk: number;
  avg_fraud_score: number;
  total_flagged: number;
}

export interface GeographicRisk {
  region: string;
  risk_level: number;
  claim_count: number;
  coordinates?: [number, number];
}

export interface TimeSeriesData {
  date: string;
  claims: number;
  avg_risk: number;
  flagged: number;
}

export interface FlagFrequency {
  flag: string;
  count: number;
  percentage: number;
}

export interface EmployerRisk {
  employer: string;
  risk_score: number;
  claim_count: number;
  total_amount: number;
}
