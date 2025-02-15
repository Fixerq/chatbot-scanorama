
import { Result } from '@/components/ResultsTable';

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

export interface SearchResult {
  url: string;
  title?: string;
  description?: string;
  details: {
    title?: string;
    description?: string;
    lastChecked?: string;
    address?: string;
    businessType?: string;
    phoneNumber?: string;
    search_batch_id: string; // Changed from optional to required
    business_name?: string;
    website_url?: string;
    [key: string]: any; // Added to match Result interface
  };
}

export interface SearchResponse {
  data: {
    results: SearchResult[];
    hasMore: boolean;
    searchBatchId: string;
  };
}

