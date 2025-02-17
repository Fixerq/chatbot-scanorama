
// Basic status types
export type Status = 'pending' | 'processing' | 'completed' | 'failed';

// Simple pattern match type without circular references
export interface PatternMatch {
  type: string;
  pattern: string;
  matched: string;
}

// Analysis result with simplified structure and fixed types
export interface AnalysisResult {
  has_chatbot: boolean;
  chatSolutions: string[];
  status: Status;
  error?: string;
  lastChecked?: string;
  details?: {
    patterns?: PatternMatch[];
    error?: string;
  };
}

// Type guard for safer type checking
export function isAnalysisResult(obj: unknown): obj is AnalysisResult {
  if (!obj || typeof obj !== 'object') return false;
  
  const result = obj as Partial<AnalysisResult>;
  return (
    typeof result.has_chatbot === 'boolean' &&
    Array.isArray(result.chatSolutions) &&
    typeof result.status === 'string'
  );
}

// Simple metadata type
export interface SearchMetadata {
  place_id?: string;
  business_name?: string;
  formatted_address?: string;
  [key: string]: unknown;
}

// Search result interface without circular references
export interface SearchResult {
  url: string;
  title?: string;
  description?: string;
  status: Status;
  error?: string;
  analysis_result?: AnalysisResult;
  metadata?: SearchMetadata;
}
