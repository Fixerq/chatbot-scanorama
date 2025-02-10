
export interface SearchRequest {
  query: string;
  country: string;
  region: string;
  startIndex?: number;
}

export interface SearchResponse {
  results: SearchResult[];
  hasMore: boolean;
}

export interface SearchResult {
  url: string;
  details: {
    title: string;
    description: string;
    lastChecked: string;
  };
}
