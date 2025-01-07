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
  selectors?: Record<string, string[]>;
  html?: string;
  markdown?: string;
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

export type CrawlFormat = "html" | "markdown" | "rawHtml" | "content" | "links" | "screenshot" | "screenshot@fullPage" | "extract";

export interface CrawlScrapeOptions {
  formats?: CrawlFormat[];
  timeout?: number;
  selectors?: {
    [key: string]: {
      selector: string;
      type: string;
      attribute?: string;
    };
  };
}