
export interface ChatbotDetectionResponse {
  status: string;
  chatSolutions?: string[];
  lastChecked?: string;
  website_url?: string | null;
  business_name?: string | null;
  phone?: string | null;
  address?: string | null;
}

export interface ChatDetectionResult {
  status: string;
  chatSolutions: string[];
  lastChecked: string;
  note?: string;
  error?: string;
  website_url?: string | null;
  business_name?: string | null;
}

// Helper type guard
export function isChatDetectionResult(obj: unknown): obj is ChatDetectionResult {
  const result = obj as ChatDetectionResult;
  return (
    typeof result === 'object' &&
    result !== null &&
    typeof result.status === 'string' &&
    Array.isArray(result.chatSolutions) &&
    typeof result.lastChecked === 'string'
  );
}

