
export const ALLOWED_ORIGINS = [
  'https://detectify.engageai.pro',
  'https://detectifys.engageai.pro',
  'https://d261f35a-a484-4323-82d8-e28223e9f6af.lovableproject.com',
  'https://d261f35a-a484-4323-82d8-e28223e9f6af.lovable.app',
  'https://id-preview--d261f35a-a484-4323-82d8-e28223e9f6af.lovable.app',
  'https://cfelpyucqllkshmlkwxz.supabase.co',
  'http://localhost:8080',
  'http://localhost:3000'
] as const;

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-application-name',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Max-Age': '86400',
  'Content-Type': 'application/json'
};

export const addCorsHeaders = (response: Response, origin: string): Response => {
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin as any) ? origin : '*';
  
  const headers = new Headers(response.headers);
  headers.set('Access-Control-Allow-Origin', allowedOrigin);
  headers.set('Access-Control-Allow-Methods', corsHeaders['Access-Control-Allow-Methods']);
  headers.set('Access-Control-Allow-Headers', corsHeaders['Access-Control-Allow-Headers']);
  headers.set('Access-Control-Max-Age', corsHeaders['Access-Control-Max-Age']);
  
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
};
