
export const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://d261f35a-a484-4323-82d8-e28223e9f6af.lovableproject.com',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': '*',
  'Content-Type': 'application/json'
};

export async function getCorsHeaders(request: Request) {
  return corsHeaders;
}
