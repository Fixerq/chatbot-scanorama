import { Result } from '@/components/ResultsTable';

export interface SearchResults {
  currentResults: Result[];
  hasMore: boolean;
}

export interface SearchState {
  query: string;
  country: string;
  region: string;
  apiKey: string;
  resultsLimit: number;
  currentPage: number;
}