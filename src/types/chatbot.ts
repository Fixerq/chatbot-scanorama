
export interface ChatbotDetectionResponse {
  status: string;
  chatSolutions?: string[];
  confidence?: number;
  verificationStatus?: 'verified' | 'unverified' | 'failed' | 'unknown';
  lastChecked?: string;
  enhancedDetection?: EnhancedDetectionResult;
  advancedDetection?: AdvancedDetectionResult;
}

export interface EnhancedDetectionResult {
  hasChatbot: boolean;
  confidence: 'high' | 'medium' | 'low';
  score: number;
  evidence: string[];
  provider: string;
}

export interface AdvancedDetectionResult {
  hasChatbot: boolean;
  confidence: 'high' | 'medium' | 'low' | 'none';
  evidence: string[];
  provider: string;
  falsePositiveChecks: string[];
  providerScore?: number;
}

/**
 * Result type for a single stage in the multi-stage detection pipeline
 */
export interface DetectionStageResult {
  proceed: boolean;
  response: ChatbotDetectionResponse;
  chatSolutions: string[];
}
