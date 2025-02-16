
export interface QueuedAnalysis {
  url: string;
  status: string;
  error_message?: string;
  started_at?: string;
  completed_at?: string;
  id: string;
  worker_id?: string;
}

export interface AnalysisQueuePayload {
  new: QueuedAnalysis;
  old: QueuedAnalysis;
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
}

export type PostgresChangesPayload<T> = {
  new: T;
  old: T;
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
};

