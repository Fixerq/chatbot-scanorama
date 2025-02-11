
export interface SearchResult {
  title: string;
  description: string;
  url: string;
}

export interface SearchResponse {
  data: {
    results: SearchResult[];
    hasMore: boolean;
  };
}

export interface GooglePlacesResult {
  name: string;
  formatted_address: string;
  website?: string;
  types: string[];
}
