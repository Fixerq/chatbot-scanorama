
export interface SearchParams {
  query: string;
  country: string;
  region: string;
}

export interface SearchResult {
  url: string;
  details: {
    title: string;
    description: string;
    lastChecked: string;
    address?: string;
    businessType?: string;
    phoneNumber?: string;
  };
}

export interface SearchResponse {
  results: SearchResult[];
  hasMore: boolean;
  searchBatchId: string;
}

export interface SubscriptionData {
  level: string;
  stripe_customer_id: string | null;
  status: string;
  searches_remaining: number;
  searches_used: number;
  total_searches: number;
}

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
