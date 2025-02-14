
import { ChatDetectionResult } from './chatbot';

export interface QueuedAnalysis {
  id: string;
  website_url: string;
  status: string;
  analysis_result: ChatDetectionResult | null;
  error_message: string | null;
}

export interface AnalysisConstants {
  RETRY_DELAY: number;
  MAX_RETRIES: number;
  POLLING_INTERVAL: number;
  MAX_POLLING_ATTEMPTS: number;
}

export const ANALYSIS_CONSTANTS: AnalysisConstants = {
  RETRY_DELAY: 2000,
  MAX_RETRIES: 3,
  POLLING_INTERVAL: 2000,
  MAX_POLLING_ATTEMPTS: 30
};

