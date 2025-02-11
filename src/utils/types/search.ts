
export interface SearchResult {
  title: string;
  description: string;
  url: string;
}

export interface SearchResponse {
  data: {
    results: SearchResult[];
    hasMore: boolean;
    searchBatchId: string;
  };
}

export interface GooglePlacesResult {
  name: string;
  formatted_address: string;
  website?: string;
  types: string[];
  rating?: number;
  photos?: {
    photo_reference: string;
    height: number;
    width: number;
  }[];
  business_status?: string;
  place_id: string;
}

export interface PlaceDetails {
  result: {
    website?: string;
    formatted_address: string;
    formatted_phone_number?: string;
    url?: string;
  };
}

export interface SearchState {
  query: string;
  country: string;
  region: string;
  apiKey: string;
  resultsLimit: number;
  currentPage: number;
}

export interface SearchResults {
  currentResults: any[]; // This matches the Result type from ResultsTable
  hasMore: boolean;
}
