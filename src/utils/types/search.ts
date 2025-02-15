
export interface SearchResult {
  title: string;
  description: string;
  url: string;
}

export interface SearchResponse {
  data: {
    results: SearchResult[];
    hasMore: boolean;
    searchBatchId: string;
  };
}

export interface GooglePlacesResult {
  name: string;
  formatted_address: string;
  website?: string;
  types: string[];
  rating?: number;
  photos?: {
    photo_reference: string;
    height: number;
    width: number;
  }[];
  business_status?: string;
  place_id: string;
}

export interface PlaceDetails {
  result: {
    website?: string;
    formatted_address: string;
    formatted_phone_number?: string;
    url?: string;
  };
}

export interface AnalysisResult {
  has_chatbot: boolean;
  chatSolutions: string[];
  status: string;
  details?: {
    dynamic_loading?: boolean;
    chat_elements?: boolean;
    meta_tags?: boolean;
    websockets?: boolean;
  };
  error?: string;
  lastChecked?: string;
}
