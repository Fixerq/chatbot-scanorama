
export interface SearchRequest {
  type?: 'get_api_key' | 'search';
  query?: string;
  country?: string;
  region?: string;
  startIndex?: number;
}

export interface SearchResponse {
  results: Array<{
    url: string;
    details: {
      title: string;
      description: string;
      lastChecked: string;
      address?: string;
      phone?: string;
      mapsUrl?: string;
      types?: string[];
      rating?: number;
    };
  }>;
  hasMore: boolean;
  apiKey?: string;
}
