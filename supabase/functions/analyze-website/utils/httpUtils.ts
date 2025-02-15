
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json'
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

