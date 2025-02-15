
export interface AnalysisResult {
  has_chatbot: boolean;
  chatSolutions: string[];
  status: string;
  error?: string;
  lastChecked?: string;
  details?: {
    patterns?: Array<{
      type: string;
      pattern: string;
      matched: string;
    }>;
    error?: string;
  };
}
