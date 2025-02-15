
export interface ChatDetectionResult {
  has_chatbot: boolean;
  chatSolutions: string[];
  details: {
    matchTypes: {
      dynamic: boolean;
      elements: boolean;
      meta: boolean;
      websockets: boolean;
    };
    matches: {
      type: string;
      pattern: string;
    }[];
  };
  lastChecked: string;
  fromCache?: boolean;
  status?: string;
  error?: string;
}

export interface AnalysisResult {
  has_chatbot: boolean;
  chatSolutions: string[];
  status: string;
  error?: string;
  lastChecked: string;
  details?: {
    patterns?: Array<{
      type: string;
      pattern: string;
      matched: string;
    }>;
    error?: string;
    matchTypes?: {
      dynamic: boolean;
      elements: boolean;
      meta: boolean;
      websockets: boolean;
    };
  };
}

