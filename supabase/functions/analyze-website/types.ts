
export interface AnalysisRequest {
  urls: string[];
  debug?: boolean;
  verifyResults?: boolean;
  deepVerification?: boolean;
  smartDetection?: boolean;
  confidenceThreshold?: number;
}

export interface ChatbotDetectionResponse {
  url: string;
  status: string;
  hasChatbot: boolean;
  chatSolutions: string[];
  confidence?: number;
  verificationStatus?: string;
  lastChecked?: string;
}
