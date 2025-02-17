
import { Status } from '@/utils/types/search';

export interface AnalysisRequest {
  status: string;
  batch_id: string;
  url: string;
}

export interface AnalysisUpdatePayload {
  url: string;
  has_chatbot: boolean;
  chatbot_solutions: string[];
  status: Status;
  error?: string;
}

export interface BatchUpdatePayload {
  status: Status;
  id: string;
  processed_urls: number;
  total_urls: number;
}

export function isAnalysisRequest(obj: any): obj is AnalysisRequest {
  return obj 
    && typeof obj.status === 'string'
    && typeof obj.batch_id === 'string'
    && typeof obj.url === 'string';
}

export function isAnalysisUpdatePayload(obj: any): obj is AnalysisUpdatePayload {
  return obj 
    && typeof obj.url === 'string'
    && typeof obj.has_chatbot === 'boolean'
    && Array.isArray(obj.chatbot_solutions)
    && typeof obj.status === 'string';
}

export function isBatchUpdatePayload(obj: any): obj is BatchUpdatePayload {
  return obj 
    && typeof obj.status === 'string'
    && typeof obj.id === 'string'
    && typeof obj.processed_urls === 'number'
    && typeof obj.total_urls === 'number';
}
