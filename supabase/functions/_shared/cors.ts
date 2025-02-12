
export const ALLOWED_ORIGINS = [
  'https://detectify.engageai.pro',
  'https://detectifys.engageai.pro',
  'https://d261f35a-a484-4323-82d8-e28223e9f6af.lovableproject.com',
  'https://d261f35a-a484-4323-82d8-e28223e9f6af.lovable.app',
  'https://id-preview--d261f35a-a484-4323-82d8-e28223e9f6af.lovable.app',
  'https://cfelpyucqllkshmlkwxz.supabase.co'
];

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

export const handleOptions = (req: Request) => {
  const origin = req.headers.get('origin');
  
  // If origin is in allowed list, return it specifically, otherwise fall back to '*'
  const allowedOrigin = origin && ALLOWED_ORIGINS.includes(origin) ? origin : '*';
  
  if (req.method === 'OPTIONS') {
    return new Response('ok', { 
      headers: {
        ...corsHeaders,
        'Access-Control-Allow-Origin': allowedOrigin
      }
    });
  }
  return null;
};
