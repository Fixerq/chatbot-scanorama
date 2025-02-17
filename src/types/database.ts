
export interface QueuedAnalysis {
  url: string;
  status: string;
  error_message?: string;
  started_at?: string;
  completed_at?: string;
  id: string;
  worker_id?: string;
  batch_id?: string;
  retry_count?: number;
  max_retries?: number;
}

export interface AnalysisQueuePayload {
  new: QueuedAnalysis;
  old: QueuedAnalysis;
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
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
  error: string;
  user_id: string;
  started_at: string;
  completed_at: string;
  analyzed: boolean;
  created_at: string;
  updated_at: string;
}

export type PostgresChangesPayload<T> = {
  new: T;
  old: T;
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
};
