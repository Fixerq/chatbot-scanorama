
export interface SearchParams {
  query: string;
  country: string;
  region?: string;
}

export interface BusinessResult {
  name: string;
  description: string;
  website?: string;
  address?: string;
  businessType?: string;
  confidenceScore: number;
}

export interface BusinessSearchResult {
  results: Array<{
    url: string;
    details: {
      title: string;
      description: string;
      lastChecked: string;
      address?: string;
      businessType?: string;
      confidence?: number;
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

