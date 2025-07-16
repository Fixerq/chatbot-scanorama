export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Apify actor IDs for different search types
export const APIFY_ACTORS = {
  BUSINESS_SEARCH: 'apify/google-search-scraper', // General business search
  MAPS_SCRAPER: 'compass/google-maps-scraper', // Google Maps business scraper
  WEBSITE_FINDER: 'lukaskrivka/website-finder', // Website finder
};

// Search configurations
export const SEARCH_CONFIG = {
  MAX_RESULTS_PER_REQUEST: 50,
  DEFAULT_COUNTRY: 'US',
  TIMEOUT_MS: 300000, // 5 minutes
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY_MS: 2000,
};

// Business type mappings
export const BUSINESS_TYPE_MAPPING: Record<string, string[]> = {
  'restaurant': ['restaurant', 'cafe', 'food', 'dining'],
  'retail': ['store', 'shop', 'retail', 'shopping'],
  'healthcare': ['doctor', 'dentist', 'medical', 'clinic', 'hospital'],
  'professional': ['lawyer', 'attorney', 'accountant', 'consultant'],
  'automotive': ['auto', 'car', 'mechanic', 'garage'],
  'beauty': ['salon', 'spa', 'beauty', 'barbershop'],
  'fitness': ['gym', 'fitness', 'yoga', 'pilates'],
  'real_estate': ['real estate', 'realtor', 'property'],
  'home_services': ['plumber', 'electrician', 'contractor', 'repair'],
  'education': ['school', 'university', 'college', 'tutor'],
  'entertainment': ['theater', 'cinema', 'entertainment', 'club'],
};

// Country mappings for better search results
export const COUNTRY_MAPPINGS: Record<string, string> = {
  'US': 'United States',
  'CA': 'Canada',
  'UK': 'United Kingdom',
  'AU': 'Australia',
  'DE': 'Germany',
  'FR': 'France',
  'IT': 'Italy',
  'ES': 'Spain',
  'NL': 'Netherlands',
  'BE': 'Belgium',
  'CH': 'Switzerland',
  'AT': 'Austria',
  'SE': 'Sweden',
  'NO': 'Norway',
  'DK': 'Denmark',
  'FI': 'Finland',
  'PL': 'Poland',
  'CZ': 'Czech Republic',
  'HU': 'Hungary',
  'RO': 'Romania',
  'BG': 'Bulgaria',
  'HR': 'Croatia',
  'SI': 'Slovenia',
  'SK': 'Slovakia',
  'LT': 'Lithuania',
  'LV': 'Latvia',
  'EE': 'Estonia',
  'IE': 'Ireland',
  'PT': 'Portugal',
  'GR': 'Greece',
  'CY': 'Cyprus',
  'MT': 'Malta',
  'LU': 'Luxembourg',
};