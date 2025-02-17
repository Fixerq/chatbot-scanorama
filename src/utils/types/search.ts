
export interface AnalysisResult {
  has_chatbot: boolean;
  chatSolutions: string[];
  status: 'pending' | 'processing' | 'completed' | 'failed';
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

// Helper type guard for safer type checking
export function isAnalysisResult(obj: unknown): obj is AnalysisResult {
  if (!obj || typeof obj !== 'object') return false;
  
  const result = obj as Partial<AnalysisResult>;
  return (
    typeof result.has_chatbot === 'boolean' &&
    Array.isArray(result.chatSolutions) &&
    typeof result.status === 'string'
  );
}

export interface SearchResult {
  url: string;
  title?: string;
  description?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error?: string;
  analysis_result?: AnalysisResult;
  metadata?: {
    place_id?: string;
    business_name?: string;
    formatted_address?: string;
    [key: string]: unknown;
  };
}
