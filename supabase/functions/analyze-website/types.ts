export interface RequestData {
  url: string;
  placeId?: string;
  queueItemId?: string;
  attempts?: number;
}

export interface ChatDetectionResult {
  status: string;
  chatSolutions: string[];
  lastChecked: string;
  note?: string;
  error?: string;
  website_url?: string | null;
  business_name?: string | null;
}

export interface ChatbotDetection {
  url: string;
  website_url: string | null;
  chatbot_platforms: string[];
  has_chatbot: boolean;
  phone?: string | null;
  address?: string | null;
  business_name?: string | null;
  last_checked: string;
}

export interface FirecrawlAnalysisResult {
  status: 'success' | 'error';
  content?: string;
  analyzed_at: string;
  error?: string;
  metadata?: any;
}

// Rate limiting types
export interface RateLimitInfo {
  ip: string;
  requests_count: number;
  window_start: Date;
  last_request: Date;
}

export const RATE_LIMIT = {
  MAX_REQUESTS: 60,
  WINDOW_MINUTES: 60
};
