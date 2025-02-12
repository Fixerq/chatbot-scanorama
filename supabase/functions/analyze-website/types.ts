
export interface RequestData {
  url: string;
  placeId?: string;
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

export interface ChatbotDetection {
  url: string;
  website_url: string | null;
  chatbot_platforms: string[];
  has_chatbot: boolean;
  phone?: string | null;
  address?: string | null;
  business_name?: string | null;
  last_checked: string;
}
