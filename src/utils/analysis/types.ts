export interface AnalysisResult {
  status: string;
  details: {
    chatSolutions?: string[];
    errorDetails?: string;
    lastChecked?: string;
  };
  technologies: string[];
}

export interface CachedResult {
  url: string;
  status: string;
  details: {
    chatSolutions?: string[];
    errorDetails?: string;
    lastChecked?: string;
  };
  technologies: string[];
  created_at: string;
}

export interface ParsedCachedResult extends CachedResult {
  id: number;
}