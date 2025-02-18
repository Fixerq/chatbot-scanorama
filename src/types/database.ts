
export interface SimplifiedAnalysisResult {
  id?: string;
  url: string;
  status: string;
  has_chatbot: boolean;
  chatbot_solutions: string[];
  error?: string;
  created_at?: string;
  updated_at?: string;
}

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface CrawlRecord {
  id: string;
  url: string;
  status: string;
  result: Json | null;
  error: string | null;
  user_id: string | null;
  started_at: string | null;
  completed_at: string | null;
  analyzed: boolean | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface QueuedAnalysis {
  id: string;
  url: string;
  status: string;
  error_message?: string;
  started_at?: string;
  completed_at?: string;
  batch_id?: string;
  retry_count?: number;
  max_retries?: number;
  metadata?: Json;
  created_at?: string;
  updated_at?: string;
}

