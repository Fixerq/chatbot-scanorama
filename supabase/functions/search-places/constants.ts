
export const METERS_PER_MILE = 1609.34;
export const MAX_RESULTS = 50;
export const GEOCODING_CACHE_TTL = 86400;

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-custom-header',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

export const getSearchRadius = (region: string | undefined): number => {
  return Math.round((region ? 30 : 100) * METERS_PER_MILE);
};
