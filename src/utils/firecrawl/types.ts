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

export interface CrawlDocument {
  url: string;
  content?: string;
  selectors?: {
    emails?: string[];
    [key: string]: any;
  };
}

export interface CrawlStatusResponse {
  success: true;
  status: string;
  completed: number;
  total: number;
  creditsUsed: number;
  expiresAt: string;
  data: CrawlDocument[];
}

export type ApiResponse = SuccessResponse | ErrorResponse;
export type CrawlResponse = CrawlStatusResponse | ErrorResponse;

export interface CrawlScrapeOptions {
  formats?: string[];
  timeout?: number;
  selectors?: {
    [key: string]: {
      selector: string;
      type: string;
      attribute?: string;
    };
  };
}