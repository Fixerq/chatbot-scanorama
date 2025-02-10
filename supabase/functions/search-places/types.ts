
export interface SearchRequest {
  type?: 'get_api_key';
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
    };
  }>;
  hasMore: boolean;
  apiKey?: string;
}
