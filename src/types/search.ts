
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

export interface PlacesResult {
  id: string;
  displayName?: {
    text?: string;
  };
  formattedAddress?: string;
  websiteUri?: string;
  internationalPhoneNumber?: string;
  rating?: number;
  userRatingCount?: number;
  primaryType?: string;
  types?: string[];
  priceLevel?: number;
  regularOpeningHours?: {
    periods?: Array<{
      open?: {
        day?: number;
        hour?: number;
        minute?: number;
      };
      close?: {
        day?: number;
        hour?: number;
        minute?: number;
      };
    }>;
  };
  businessStatus?: string;
  photos?: any[];
}
