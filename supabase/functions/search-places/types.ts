
export interface SearchParams {
  query: string;
  country: string;
  region?: string;
}

export interface BusinessSearchResult {
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
}

export interface APIKeyResponse {
  apiKey: string;
}
