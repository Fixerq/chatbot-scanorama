
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
  lastChecked: string;
  error?: string;
}
