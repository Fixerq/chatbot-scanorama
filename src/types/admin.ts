export interface CustomerData {
  profile: {
    id: string;
    created_at: string;
    api_key: string | null;
  };
  subscription: {
    id: string;
    user_id: string;
    status: string;
    level: string | null;
    current_period_end: string | null;
  };
  searchesRemaining: number;
  totalSearches: number;
  email: string;
}