
export interface RequestData {
  url: string;
  requestId?: string;
}

export const RATE_LIMIT = {
  WINDOW_MINUTES: 60,
  MAX_REQUESTS: 3000
} as const;

export interface ChatDetectionResult {
  has_chatbot: boolean;
  chatSolutions: string[];
  details: {
    matchTypes?: {
      dynamic: boolean;
      elements: boolean;
      meta: boolean;
      websockets: boolean;
    };
    matches?: Array<{
      type: string;
      pattern: string;
    }>;
    error?: string;
  };
  lastChecked: string;
}

export interface AnalysisResult {
  id: string;
  url: string;
  status: 'completed' | 'failed' | 'processing';
  has_chatbot: boolean;
  chatbot_solutions: string[];
  details: Record<string, any>;
  last_checked: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}
