
export interface SimplifiedAnalysisResult {
  id?: string;
  url: string;
  status: string;
  has_chatbot: boolean;
  chatbot_solutions: string[];
  error?: string;
  created_at?: string;
  updated_at?: string;
}
