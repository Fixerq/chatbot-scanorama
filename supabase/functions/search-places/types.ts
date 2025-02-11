
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

export interface SubscriptionData {
  level: string;
  stripe_customer_id: string | null;
  status: string;
  searches_remaining: number;
  searches_used: number;
  total_searches: number;
}
