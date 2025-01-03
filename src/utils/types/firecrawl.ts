export interface SearchResult {
  url: string;
  title: string;
  description?: string;
}

export interface ErrorResponse {
  success: false;
  error: string;
}

export interface SuccessResponse {
  success: true;
  data: SearchResult[];
  warning?: {
    _type: string;
    value: string;
  };
}

export type ApiResponse = SuccessResponse | ErrorResponse;

export interface CrawlStatusResponse {
  success: true;
  status: string;
  completed: number;
  total: number;
  creditsUsed: number;
  expiresAt: string;
  data: any[];
}

export type CrawlResponse = CrawlStatusResponse | ErrorResponse;