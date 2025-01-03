export interface AnalysisResult {
  status: string;
  details: {
    chatSolutions?: string[];
    errorDetails?: string;
    lastChecked?: string;
    platform?: string;
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
    platform?: string;
  };
  technologies: string[];
  created_at: string;
}