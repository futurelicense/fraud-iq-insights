// Enterprise-grade fraud detection types based on benefits system architecture

export interface BenefitsClaim {
  claimId: string;
  claimantId: string;
  caseNumber: string;
  programType: 'UI' | 'PUA' | 'PEUC' | 'DUA';
  benefitYear: string;
  weeklyBenefitAmount: number;
  maximumBenefitAmount: number;
  effectiveDate: string;
  expirationDate: string;
  status: 'ACTIVE' | 'INACTIVE' | 'PENDING' | 'DENIED' | 'EXHAUSTED';
  lastCertificationDate?: string;
  totalAmountPaid: number;
  remainingBalance: number;
  createdDate: string;
  lastModifiedDate: string;
  createdBy: string;
  lastModifiedBy: string;
}

export interface ClaimantProfile {
  claimantId: string;
  ssn: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  dateOfBirth: string;
  gender: 'M' | 'F' | 'X';
  emailAddress: string;
  phoneNumber: string;
  alternatePhone?: string;
  mailingAddress: Address;
  residenceAddress: Address;
  preferredLanguage: string;
  riskScore: number;
  riskFlags: string[];
  identityVerificationStatus: 'VERIFIED' | 'PENDING' | 'FAILED' | 'NOT_REQUIRED';
  lastLoginDate?: string;
  accountCreationDate: string;
  accountStatus: 'ACTIVE' | 'LOCKED' | 'SUSPENDED' | 'CLOSED';
}

export interface Address {
  streetAddress1: string;
  streetAddress2?: string;
  city: string;
  state: string;
  zipCode: string;
  county?: string;
  country: string;
}

export interface EmployerRecord {
  employerId: string;
  federalEin: string;
  legalName: string;
  tradeName?: string;
  naicsCode: string;
  industryDescription: string;
  address: Address;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  totalEmployees: number;
  quarterlyWageReports: QuarterlyWageReport[];
  suspiciousActivityFlags: string[];
  lastAuditDate?: string;
}

export interface QuarterlyWageReport {
  reportId: string;
  employerId: string;
  quarter: string;
  year: number;
  totalWages: number;
  totalEmployees: number;
  submittedDate: string;
  submittedBy: string;
  status: 'SUBMITTED' | 'ACCEPTED' | 'REJECTED' | 'UNDER_REVIEW';
  wageRecords: WageRecord[];
}

export interface WageRecord {
  recordId: string;
  claimantId: string;
  employerId: string;
  quarter: string;
  year: number;
  grossWages: number;
  hoursWorked: number;
  separationReason?: string;
  separationDate?: string;
  isActive: boolean;
}

export interface FraudCase {
  caseId: string;
  caseNumber: string;
  caseType: 'IDENTITY_THEFT' | 'WAGE_FALSIFICATION' | 'ELIGIBILITY_FRAUD' | 'EMPLOYER_FRAUD' | 'ORGANIZED_FRAUD';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'OPEN' | 'UNDER_INVESTIGATION' | 'PENDING_REVIEW' | 'CLOSED' | 'REFERRED';
  claimantId: string;
  relatedClaimIds: string[];
  fraudScore: number;
  potentialLoss: number;
  actualLoss: number;
  recoveredAmount: number;
  assignedInvestigator?: string;
  createdDate: string;
  lastUpdatedDate: string;
  closureDate?: string;
  closureReason?: string;
  investigationNotes: InvestigationNote[];
  evidenceItems: EvidenceItem[];
  businessRulesTriggered: BusinessRuleTrigger[];
}

export interface InvestigationNote {
  noteId: string;
  caseId: string;
  investigatorId: string;
  noteType: 'GENERAL' | 'EVIDENCE' | 'CONTACT' | 'DECISION' | 'REFERRAL';
  content: string;
  isConfidential: boolean;
  createdDate: string;
  lastModifiedDate: string;
}

export interface EvidenceItem {
  evidenceId: string;
  caseId: string;
  evidenceType: 'DOCUMENT' | 'SYSTEM_LOG' | 'WITNESS_STATEMENT' | 'FINANCIAL_RECORD' | 'DIGITAL_EVIDENCE';
  description: string;
  filePath?: string;
  sourceSystem?: string;
  collectedBy: string;
  collectedDate: string;
  chainOfCustody: CustodyRecord[];
}

export interface CustodyRecord {
  recordId: string;
  evidenceId: string;
  custodian: string;
  transferDate: string;
  transferReason: string;
  digitallySigned: boolean;
}

export interface BusinessRule {
  ruleId: string;
  ruleName: string;
  ruleType: 'VALIDATION' | 'SCORING' | 'FLAGGING' | 'BLOCKING';
  category: 'IDENTITY' | 'ELIGIBILITY' | 'WAGE' | 'EMPLOYER' | 'BEHAVIORAL' | 'CROSS_REFERENCE';
  description: string;
  conditions: RuleCondition[];
  actions: RuleAction[];
  severity: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';
  isActive: boolean;
  effectiveDate: string;
  expirationDate?: string;
  createdBy: string;
  lastModifiedBy: string;
  lastModifiedDate: string;
}

export interface RuleCondition {
  conditionId: string;
  fieldName: string;
  operator: 'EQUALS' | 'NOT_EQUALS' | 'GREATER_THAN' | 'LESS_THAN' | 'CONTAINS' | 'REGEX' | 'IN_LIST' | 'NOT_IN_LIST';
  value: any;
  logicalOperator?: 'AND' | 'OR';
}

export interface RuleAction {
  actionId: string;
  actionType: 'SET_FLAG' | 'ADD_SCORE' | 'BLOCK_CLAIM' | 'REQUIRE_VERIFICATION' | 'CREATE_CASE' | 'SEND_ALERT';
  parameters: Record<string, any>;
}

export interface BusinessRuleTrigger {
  triggerId: string;
  ruleId: string;
  ruleName: string;
  caseId?: string;
  claimId?: string;
  triggerDate: string;
  severity: string;
  message: string;
  actionsTaken: string[];
  dataSnapshot: Record<string, any>;
}

export interface RiskAssessmentResult {
  assessmentId: string;
  claimId: string;
  claimantId: string;
  assessmentDate: string;
  overallRiskScore: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  riskFactors: RiskFactor[];
  recommendedActions: string[];
  requiresInvestigation: boolean;
  autoApprovalEligible: boolean;
  modelVersion: string;
  confidenceScore: number;
}

export interface RiskFactor {
  factorId: string;
  factorName: string;
  category: string;
  impact: number;
  confidence: number;
  description: string;
  evidence: string[];
}

export interface AuditTrail {
  auditId: string;
  entityType: 'CLAIM' | 'CLAIMANT' | 'CASE' | 'INVESTIGATION' | 'BUSINESS_RULE';
  entityId: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'VIEW' | 'APPROVE' | 'DENY';
  userId: string;
  userName: string;
  userRole: string;
  timestamp: string;
  ipAddress: string;
  userAgent?: string;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  reason?: string;
  systemGenerated: boolean;
}

export interface SystemAlert {
  alertId: string;
  alertType: 'FRAUD_THRESHOLD' | 'SYSTEM_ANOMALY' | 'DATA_QUALITY' | 'PERFORMANCE' | 'SECURITY';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  title: string;
  description: string;
  entityType?: string;
  entityId?: string;
  triggeredBy: string;
  triggeredDate: string;
  acknowledgedBy?: string;
  acknowledgedDate?: string;
  resolvedBy?: string;
  resolvedDate?: string;
  status: 'OPEN' | 'ACKNOWLEDGED' | 'RESOLVED' | 'DISMISSED';
  metadata: Record<string, any>;
}

export interface CrossMatchResult {
  matchId: string;
  sourceType: 'SSN' | 'NAME' | 'ADDRESS' | 'PHONE' | 'EMAIL' | 'DEVICE_ID' | 'IP_ADDRESS';
  sourceValue: string;
  matchType: 'EXACT' | 'FUZZY' | 'PHONETIC';
  matchConfidence: number;
  relatedEntities: RelatedEntity[];
  riskImplications: string[];
  identifiedDate: string;
}

export interface RelatedEntity {
  entityType: 'CLAIMANT' | 'EMPLOYER' | 'CLAIM' | 'CASE';
  entityId: string;
  relationshipType: string;
  strength: number;
  lastActivity: string;
}