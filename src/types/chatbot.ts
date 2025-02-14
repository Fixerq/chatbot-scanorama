
export interface ChatDetectionResult {
  status: string;
  has_chatbot: boolean;
  chatSolutions: string[];
  lastChecked: string;
}

export interface ChatbotDetectionResponse {
  status: string;
  chatSolutions: string[];
  lastChecked: string;
  website_url?: string | null;
  business_name?: string | null;
}

export function isChatDetectionResult(obj: any): obj is ChatDetectionResult {
  return (
    obj &&
    typeof obj.status === 'string' &&
    typeof obj.has_chatbot === 'boolean' &&
    Array.isArray(obj.chatSolutions) &&
    typeof obj.lastChecked === 'string'
  );
}

