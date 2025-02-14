
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
