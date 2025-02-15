
export interface AnalysisRequest {
  url: string;
  requestId: string;
}

export interface AnalysisResult {
  has_chatbot: boolean;
  chatbot_solutions: string[];
  status: 'pending' | 'processing' | 'completed' | 'failed';
  details: {
    lastChecked: string;
    source: string;
    [key: string]: any;
  };
}
