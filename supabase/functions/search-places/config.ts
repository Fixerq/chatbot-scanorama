
import { CountryCodeMap, CountryBounds, CountryDomains, PlaceFields } from './types.ts';

// CORS headers for all responses
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, prefer',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400'
};

// Country code mappings (full names to ISO codes)
export const countryCodeMap: CountryCodeMap = {
  'Australia': 'AU',
  'United States': 'US',
  'United Kingdom': 'GB',
  'Canada': 'CA',
  'New Zealand': 'NZ',
  'India': 'IN',
  'South Africa': 'ZA',
  'Ireland': 'IE',
  'Singapore': 'SG',
  'Malaysia': 'MY',
  'Philippines': 'PH',
  'Hong Kong': 'HK',
  'Japan': 'JP',
  'China': 'CN',
  'Brazil': 'BR',
  'Mexico': 'MX',
  'Germany': 'DE',
  'France': 'FR',
  'Italy': 'IT',
  'Spain': 'ES',
  'Netherlands': 'NL',
  'Sweden': 'SE',
  'Norway': 'NO',
  'Denmark': 'DK',
  'Finland': 'FI'
};

// Region/state geographic boundaries for location bias
export const regionBounds: { [country: string]: CountryBounds } = {
  'AU': {
    'Western Australia': {
      low: { latitude: -35.13, longitude: 112.92 },
      high: { latitude: -13.68, longitude: 129.00 }
    },
    'Victoria': {
      low: { latitude: -39.16, longitude: 140.96 },
      high: { latitude: -33.98, longitude: 150.00 }
    },
    'New South Wales': {
      low: { latitude: -37.51, longitude: 141.00 },
      high: { latitude: -28.16, longitude: 153.64 }
    },
    'Queensland': {
      low: { latitude: -29.18, longitude: 138.00 },
      high: { latitude: -10.68, longitude: 153.55 }
    },
    'South Australia': {
      low: { latitude: -38.06, longitude: 129.00 },
      high: { latitude: -26.00, longitude: 141.00 }
    },
    'Tasmania': {
      low: { latitude: -43.64, longitude: 143.82 },
      high: { latitude: -39.58, longitude: 148.52 }
    },
    'Northern Territory': {
      low: { latitude: -26.00, longitude: 129.00 },
      high: { latitude: -10.97, longitude: 138.00 }
    },
    'Australian Capital Territory': {
      low: { latitude: -35.92, longitude: 148.76 },
      high: { latitude: -35.12, longitude: 149.40 }
    }
  },
  'US': {
    'California': {
      low: { latitude: 32.53, longitude: -124.48 },
      high: { latitude: 42.01, longitude: -114.13 }
    },
    'New York': {
      low: { latitude: 40.50, longitude: -79.76 },
      high: { latitude: 45.01, longitude: -71.85 }
    },
    'Texas': {
      low: { latitude: 25.84, longitude: -106.65 },
      high: { latitude: 36.50, longitude: -93.51 }
    },
    'Florida': {
      low: { latitude: 24.52, longitude: -87.63 },
      high: { latitude: 31.00, longitude: -80.03 }
    },
    'Connecticut': {
      low: { latitude: 40.98, longitude: -73.73 },
      high: { latitude: 42.05, longitude: -71.79 }
    },
    'Delaware': {
      low: { latitude: 38.45, longitude: -75.79 },
      high: { latitude: 39.84, longitude: -75.05 }
    }
    // Add other states as needed
  },
  'GB': {
    'England': {
      low: { latitude: 49.96, longitude: -6.42 },
      high: { latitude: 55.81, longitude: 1.76 }
    },
    'Scotland': {
      low: { latitude: 54.63, longitude: -8.65 },
      high: { latitude: 60.86, longitude: -0.76 }
    },
    'Wales': {
      low: { latitude: 51.35, longitude: -5.47 },
      high: { latitude: 53.44, longitude: -2.65 }
    },
    'Northern Ireland': {
      low: { latitude: 54.01, longitude: -8.18 },
      high: { latitude: 55.34, longitude: -5.43 }
    }
  }
  // Add other countries as needed
};

// Country-specific domain TLDs for filtering
export const countryDomains: CountryDomains = {
  'AU': ['.au', '.com.au', '.net.au', '.org.au'],
  'US': ['.us', '.com', '.org', '.net', '.edu'],
  'GB': ['.uk', '.co.uk', '.org.uk', '.ac.uk'],
  'CA': ['.ca', '.com.ca', '.org.ca'],
  'NZ': ['.nz', '.co.nz', '.org.nz'],
  'IN': ['.in', '.co.in', '.org.in'],
  'SG': ['.sg', '.com.sg', '.org.sg']
  // Add other countries as needed
};

// Map to distinguish between search fields and response fields
export const PLACE_FIELDS: PlaceFields = {
  id: 'places.id',
  displayName: 'places.displayName',
  formattedAddress: 'places.formattedAddress',
  websiteUri: 'places.websiteUri',
  internationalPhoneNumber: 'places.internationalPhoneNumber',
  rating: 'places.rating',
  userRatingCount: 'places.userRatingCount',
  primaryType: 'places.primaryType',
  types: 'places.types',
  priceLevel: 'places.priceLevel',
  regularOpeningHours: 'places.regularOpeningHours',
  photos: 'places.photos',
  businessStatus: 'places.businessStatus'
};
