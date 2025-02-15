
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-forwarded-for, x-real-ip',
  'Content-Type': 'application/json',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Max-Age': '86400'
};

export function getRealIp(req: Request): string {
  const cfConnectingIp = req.headers.get('cf-connecting-ip');
  if (cfConnectingIp) return cfConnectingIp;

  const forwardedFor = req.headers.get('x-forwarded-for');
  if (forwardedFor) {
    const ips = forwardedFor.split(',');
    return ips[0].trim();
  }

  const directIp = req.headers.get('x-real-ip');
  return directIp || 'unknown';
}

export function handleCorsResponse(response: Response): Response {
  const responseWithCors = new Response(response.body, response);
  Object.entries(corsHeaders).forEach(([key, value]) => {
    responseWithCors.headers.set(key, value);
  });
  return responseWithCors;
}
