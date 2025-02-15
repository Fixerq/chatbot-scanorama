export interface ChatDetectionResult {
  has_chatbot: boolean;
  chatSolutions: string[];
  details: {
    matchTypes?: {
      dynamic?: boolean;
      elements?: boolean;
      meta?: boolean;
      websockets?: boolean;
    };
    matches?: Array<{
      type: string;
      pattern: string;
      matched: string;
    }>;
    error?: string;
    stack?: string;
  };
  status?: string;
  error?: string;
  fromCache?: boolean;
  lastChecked: string;
}

export interface AnalysisResult {
  status: string;
  url: string;
  has_chatbot?: boolean;
  chatSolutions?: string[];
  error?: string;
  details?: Record<string, any>;
}

export const RATE_LIMIT = {
  WINDOW_MINUTES: 60,
  MAX_REQUESTS: 3000
};

export interface RequestData {
  url: string;
  options?: Record<string, any>;
}
