
// Stub types kept for backward compatibility
// The Firecrawl integration has been deprecated

export interface ErrorResponse {
  success: false;
  error: string;
}

export interface CrawlDocument {
  url: string;
  content?: string;
  selectors?: Record<string, string[]>;
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

export type CrawlResponse = CrawlStatusResponse | ErrorResponse;
export type CrawlFormat = string;
export interface CrawlScrapeOptions {
  formats: CrawlFormat[];
  timeout?: number;
  selectors?: Record<string, any>;
}
