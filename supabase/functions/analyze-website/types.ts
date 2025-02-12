
export interface RequestData {
  url: string;
  placeId?: string;
}

export interface ChatDetectionResult {
  status: string;
  chatSolutions: string[];
  lastChecked: string;
}

export interface PlaceDetails {
  website?: string;
  phone?: string;
  address?: string;
}

export interface ChatbotDetection {
  url: string;
  chatbot_platforms: string[];
  has_chatbot: boolean;
  phone?: string | null;
  address?: string | null;
  last_checked: string;
}
