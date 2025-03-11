
// Country code mappings and region bounds types
export interface RegionBounds {
  low: { latitude: number; longitude: number };
  high: { latitude: number; longitude: number };
}

export interface CountryBounds {
  [region: string]: RegionBounds;
}

export interface PlacesSearchOptions {
  query: string;
  country: string;
  region: string;
  pageToken?: string;
  limit?: number;
  existingPlaceIds?: string[];
}

export interface SearchResponse {
  results: any[];
  nextPageToken?: string;
  hasMore: boolean;
}

// Country code mapping type
export interface CountryCodeMap {
  [fullName: string]: string;
}

// Domain TLD mapping type
export interface CountryDomains {
  [countryCode: string]: string[];
}

// Place fields mapping type
export interface PlaceFields {
  [key: string]: string;
}
