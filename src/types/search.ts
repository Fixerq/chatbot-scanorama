
import { Result } from '@/components/ResultsTable';

export interface SearchResults {
  currentResults: Result[];
  hasMore: boolean;
}

export interface SearchParams {
  query: string;
  country: string;
  region?: string;
  limit?: number;
}

export interface SearchResponse {
  results: Result[];
  hasMore: boolean;
  nextPageToken?: string;
}
