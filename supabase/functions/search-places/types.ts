
export interface SearchRequest {
  query: string;
  country: string;
  region: string;
  startIndex?: number;
}

export interface PlaceResult {
  url: string;
  details: {
    title: string;
    description: string;
    lastChecked: string;
    placeId?: string;
    formattedAddress?: string;
    phoneNumber?: string;
    rating?: number;
    location?: {
      lat: number;
      lng: number;
    };
  };
}

export interface SearchResponse {
  results: PlaceResult[];
  hasMore: boolean;
  error?: string;
}
