
export const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://detectifys.engageai.pro',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': '*',
  'Content-Type': 'application/json'
};

export async function getCorsHeaders(request: Request) {
  return corsHeaders;
}
