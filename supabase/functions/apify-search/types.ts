export interface ApifySearchOptions {
  query: string;
  country?: string;
  region?: string;
  limit?: number;
  pageToken?: string;
  apiKey?: string;
}

export interface ApifySearchResponse {
  results: ApifyResult[];
  nextPageToken?: string;
  hasMore: boolean;
}

export interface ApifyResult {
  id?: string;
  url: string;
  status?: string;
  details?: {
    title?: string;
    description?: string;
    phone?: string;
    email?: string;
    rating?: number;
    reviewCount?: number;
    businessType?: string;
    location?: string;
    lastChecked?: string;
    chatSolutions?: string[];
    confidence?: number;
    verificationStatus?: string;
  };
  _metadata?: {
    nextPageToken?: string;
    searchId?: string;
  };
}

export interface ApifyBusinessData {
  name?: string;
  url?: string;
  domain?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  region?: string;
  country?: string;
  postalCode?: string;
  description?: string;
  category?: string;
  rating?: number;
  reviewCount?: number;
  socialProfiles?: string[];
  contactEmails?: string[];
  contactPhones?: string[];
}