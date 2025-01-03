export interface ErrorResponse {
  success: false;
  error: string;
}

export interface SearchResult {
  url: string;
  title: string;
  description?: string;
}

export interface SuccessResponse {
  success: true;
  data: SearchResult[];
  warning?: {
    _type: string;
    value: string;
  };
}

export interface CrawlStatusResponse {
  success: true;
  status: string;
  completed: number;
  total: number;
  creditsUsed: number;
  expiresAt: string;
  data: any[];
}

export type ApiResponse = SuccessResponse | ErrorResponse;
export type CrawlResponse = CrawlStatusResponse | ErrorResponse;

export interface SearchOptions {
  query: string;
  country: string;
  region?: string;
  limit?: number;
}