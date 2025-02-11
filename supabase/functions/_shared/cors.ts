
export const ALLOWED_ORIGINS = [
  'https://detectify.engageai.pro',
  'https://detectifys.engageai.pro',
  'https://d261f35a-a484-4323-82d8-e28223e9f6af.lovableproject.com',
  'https://d261f35a-a484-4323-82d8-e28223e9f6af.lovable.app',
  'https://id-preview--d261f35a-a484-4323-82d8-e28223e9f6af.lovable.app'
];

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export function handleOptions(req: Request) {
  const origin = req.headers.get('origin');
  console.log('Handling CORS for origin:', origin);
  
  if (req.method === 'OPTIONS') {
    console.log('Processing OPTIONS request from origin:', origin);
    return new Response(null, {
      headers: {
        ...corsHeaders,
        'Access-Control-Allow-Origin': origin || '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      }
    });
  }
  return null;
}
