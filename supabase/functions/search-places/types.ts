
export interface SearchRequest {
  query: string;
  country: string;
  region: string;
  startIndex?: number;
}

export interface GeocodeResponse {
  results: {
    geometry: {
      location: {
        lat: number;
        lng: number;
      };
    };
  }[];
}

export interface GeocodeCacheEntry {
  lat: number;
  lng: number;
  timestamp: number;
}

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface SearchResult {
  url: string;
  details: {
    title: string;
    description: string;
    lastChecked: string;
  };
}

export interface SearchResponse {
  results: SearchResult[];
  hasMore: boolean;
}
