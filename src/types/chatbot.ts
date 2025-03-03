
export interface ChatbotDetectionResponse {
  status: string;
  chatSolutions?: string[];
  confidence?: number;
  verificationStatus?: 'verified' | 'unverified' | 'failed' | 'unknown';
  lastChecked?: string;
  enhancedDetection?: EnhancedDetectionResult;
}

export interface EnhancedDetectionResult {
  hasChatbot: boolean;
  confidence: 'high' | 'medium' | 'low';
  score: number;
  evidence: string[];
  provider: string;
}
