export type VisaRouteId = 
  | 'uk_global_talent'
  | 'us_o1a'
  | 'us_eb1a'
  | 'canada_suv'
  | 'germany_chancenkarte'
  | 'france_tech_visa';

export interface VisaRoute {
  id: VisaRouteId;
  name: string;
  country: string;
  countryCode: string;
  flag: string;
  endorsementBody: string;
  difficulty: 'Moderate' | 'High' | 'Very High';
  processingTimeMonths: string;
  tracks: string[];
  mandatoryCriteriaDescription: string;
  optionalCriteriaCountRequired: number;
  totalOptionalCriteriaAvailable: number;
  maxEvidenceItems: number;
  referenceLettersRequired: number;
}

export interface CandidateProfile {
  id: string;
  fullName: string;
  email: string;
  currentRole: string;
  currentCountry: string;
  targetCountries: string[];
  yearsExperience: number;
  trackPreference: 'Talent' | 'Promise' | 'Founder' | 'Specialist';
  companyType: 'Early Startup' | 'Scale-up' | 'Enterprise' | 'Consultancy' | 'Research/Academia';
  salaryUsdEquivalent: number;
  equityOrStockOptions: boolean;
  openSourceContributions: boolean;
  openSourceStars?: number;
  githubUrl?: string;
  publicationsCount: number;
  citationsCount: number;
  speakingEngagements: number;
  commercialImpactSummary: string;
  patentsCount: number;
  judgingOrMentoringCount: number;
  recommendationLettersReady: number;
  evidenceItemsCount: number;
  skills: string[];
  bio: string;
}

export interface CriteriaEvaluation {
  code: string;
  name: string;
  category: 'Mandatory' | 'Optional';
  status: 'Met' | 'Partially Met' | 'Gap' | 'Not Started';
  confidenceScore: number; // 0 - 100
  matchedEvidence: string[];
  remediationAdvice: string;
}

export interface RouteMatchResult {
  route: VisaRoute;
  overallFitPercentage: number;
  readinessLevel: 'High Readiness' | 'Moderate Gap' | 'Action Plan Required';
  evaluatedTrack: string;
  criteriaEvaluations: CriteriaEvaluation[];
  drZenithRecommendation: string;
  missingEvidenceSummary: string[];
}

export interface PipelineExecutionLog {
  id: string;
  timestamp: string;
  stage: 'Ingestion' | 'Normalization' | 'Evaluation' | 'Evidence_Audit' | 'Webhook_Dispatch';
  level: 'info' | 'warn' | 'success' | 'error';
  message: string;
  details?: Record<string, unknown>;
}

export interface WebhookEvent {
  id: string;
  event: string;
  timestamp: string;
  targetUrl: string;
  system: 'HubSpot CRM' | 'WhatsApp Bot' | 'Slack Coach Channel' | 'Dr. Zenith Engine' | 'Client Portal';
  status: 'delivered' | 'retrying' | 'failed';
  httpStatus: number;
  latencyMs: number;
  payload: Record<string, unknown>;
  signature: string;
}

export interface EvidenceItem {
  id: string;
  title: string;
  category: 'MC_Recognition' | 'OC1_Innovation' | 'OC2_Outside_Work' | 'OC3_Significant_Contribution' | 'OC4_Academic';
  targetCriterionName: string;
  documentType: 'Letter' | 'Metrics_Dashboard' | 'Employment_Contract' | 'Patent' | 'Media_Article' | 'Code_Repository';
  pages: number;
  hasOfficialLetterhead: boolean;
  isThirdPartyCorroborated: boolean;
  score: number; // 0-100
  feedback: string;
}
