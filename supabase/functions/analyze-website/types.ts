
export interface ChatbotDetectionRequest {
  url: string;
  options?: {
    smartDetection?: boolean;
    confidenceThreshold?: number;
    debug?: boolean;
  };
}

export interface ChatbotDetectionResponse {
  url: string;
  status: string;
  hasChatbot: boolean;
  chatSolutions?: string[];
  confidence?: number;
  verificationStatus?: 'verified' | 'unverified' | 'failed';
  error?: string;
  lastChecked: string;
}
