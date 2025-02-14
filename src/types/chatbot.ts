
export interface ChatDetectionResult {
  status: string;
  has_chatbot: boolean;
  chatSolutions: string[];
  lastChecked: string;
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

