
export interface ChatbotDetectionResponse {
  status: string;
  chatSolutions?: string[];
  confidence?: number;
  verificationStatus?: 'verified' | 'unverified' | 'failed' | 'unknown';
  lastChecked?: string;
}
