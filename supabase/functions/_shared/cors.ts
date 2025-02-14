
const ALLOWED_ORIGINS = [
  'https://d261f35a-a484-4323-82d8-e28223e9f6af.lovableproject.com',
  'https://cfelpyucqllkshmlkwxz.supabase.co',
  'http://localhost:3000',  // For local development
];

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // We'll dynamically set this based on the request origin
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
  'Content-Type': 'application/json'
};

export function getCorsHeaders(request: Request) {
  const origin = request.headers.get('origin');
  return {
    ...corsHeaders,
    'Access-Control-Allow-Origin': ALLOWED_ORIGINS.includes(origin ?? '') 
      ? origin 
      : ALLOWED_ORIGINS[0]
  };
}
