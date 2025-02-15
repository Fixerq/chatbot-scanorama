
import { Result } from '@/components/ResultsTable';

export interface SearchResult {
  url: string;
  title?: string;
  description?: string;
}

export interface SearchResponse {
  data: {
    results: SearchResult[];
    hasMore: boolean;
    searchBatchId: string;
  };
}

export interface SearchResults {
  currentResults: Result[];
  hasMore: boolean;
  nextPageToken?: string;
}

export interface SearchState {
  query: string;
  country: string;
  region: string;
  apiKey: string;
  resultsLimit: number;
  currentPage: number;
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
      confidence?: number;
      category?: string;
      subcategory?: string;
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

