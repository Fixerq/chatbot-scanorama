
/**
 * Type definitions for website analysis
 */

export interface AnalysisOptions {
  debug?: boolean;
  verifyResults?: boolean;
  deepVerification?: boolean;
  smartDetection?: boolean;
  confidenceThreshold?: number;
  checkFunctionality?: boolean;
  maxRedirects?: number;
  timeout?: number;
  detectHiddenChatbots?: boolean;
  ignoreVisibilityChecks?: boolean;
  suggestedProviders?: string[];
  maxRetries?: number; // New option to control retries
  skipFunctionalValidation?: boolean; // Option to skip functionality check
}

export interface AnalysisResult {
  url: string;
  status: string;
  hasChatbot: boolean;
  chatSolutions: string[];
  confidence?: number;
  verificationStatus?: 'verified' | 'unverified' | 'failed' | 'unknown';
  indicators?: string[];
  lastChecked: string;
  error?: string;
  // Add stage information for debugging
  stageResults?: {
    initialScan?: boolean;
    providerSpecific?: boolean;
    verification?: boolean;
    functional?: boolean;
  };
}

export interface BatchAnalysisRequest {
  urls: string[];
  options?: AnalysisOptions;
}

export interface PatternMatchResult {
  matches: string[];
  matchedPatterns: Record<string, string[]>;
  confidence: number;
}
