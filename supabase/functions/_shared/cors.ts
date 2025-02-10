
const ALLOWED_ORIGINS = [
  'https://detectify.engageai.pro',
  'https://detectifys.engageai.pro',
  'https://d261f35a-a484-4323-82d8-e28223e9f6af.lovableproject.com'
];

export const corsHeaders = {
  'Access-Control-Allow-Origin': '',  // This will be set dynamically
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export function handleOptions(req: Request) {
  const origin = req.headers.get('origin');
  
  if (req.method === 'OPTIONS') {
    console.log('Handling OPTIONS request from origin:', origin);
    
    // Only allow requests from whitelisted origins
    if (!origin || !ALLOWED_ORIGINS.includes(origin)) {
      console.warn('Rejected request from unauthorized origin:', origin);
      return new Response(null, { status: 403 });
    }
    
    return new Response(null, {
      headers: {
        ...corsHeaders,
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      }
    });
  }
  return null;
}
