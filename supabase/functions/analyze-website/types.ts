
export interface ChatDetectionResult {
  status: string;
  has_chatbot: boolean;
  has_live_elements?: boolean;
  chatSolutions: string[];
  liveElements?: string[];
  details?: {
    dynamic_loading?: boolean;
    chat_elements?: boolean;
    meta_tags?: boolean;
    websockets?: boolean;
    url?: string;
  };
  error?: string;
  lastChecked: string;
}
