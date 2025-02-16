
export interface QueuedAnalysis {
  url: string;
  status: string;
  error_message?: string;
  started_at?: string;
  completed_at?: string;
  id: string;
}

export interface AnalysisQueuePayload {
  new: QueuedAnalysis;
  old: QueuedAnalysis;
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
}
