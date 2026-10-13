export enum RiskLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
}

export interface CrisisResource {
  name: string;
  phone: string;
  description: string;
  availableHours: string;
  countryCode: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface SafetyCheckResult {
  riskLevel: RiskLevel;
  triggeredKeyword?: string;
  matchedIdiom?: string;
  crisisResources?: CrisisResource[];
  recommendedAction?: 'PROCEED_LLM' | 'PROMPT_SUPPORT' | 'STOP_AND_CRISIS';
}

export interface ChatStreamChunk {
  type: 'token' | 'sentence' | 'safety' | 'done' | 'error';
  token?: string;
  sentence?: string;
  riskLevel?: RiskLevel;
  crisisResources?: CrisisResource[];
  error?: string;
}
