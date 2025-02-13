
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0'
];

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-application-name',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Content-Type': 'application/json'
};

const getHeaders = (attempt: number) => ({
  'User-Agent': USER_AGENTS[attempt % USER_AGENTS.length],
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.5',
  'Accept-Encoding': 'gzip, deflate, br',
  'Connection': 'keep-alive',
  'Upgrade-Insecure-Requests': '1',
  'Cache-Control': 'no-cache',
  'Pragma': 'no-cache'
});

export async function fetchWithRetry(url: string, maxRetries = 2, timeout = 10000): Promise<Response> {
  let lastError;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      console.log(`Attempt ${i + 1} for URL: ${url}`);
      console.log('Using headers:', getHeaders(i));
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      const response = await fetch(url, { 
        headers: getHeaders(i),
        redirect: 'follow',
        signal: controller.signal,
        credentials: 'omit' // Explicitly omit credentials
      });
      
      clearTimeout(timeoutId);
      
      console.log(`Response status: ${response.status} for ${url}`);
      console.log('Response headers:', Object.fromEntries(response.headers));

      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After');
        const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : Math.pow(2, i) * 1000;
        console.log(`Rate limited. Waiting ${waitTime}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }

      if (response.ok) {
        console.log(`Successfully fetched ${url} on attempt ${i + 1}`);
        return response;
      }
      
      if (response.status === 404) {
        throw new Error('Page not found');
      }
      
      if (response.status === 403 || response.status === 401) {
        throw new Error('Website blocks automated access');
      }
      
      lastError = new Error(`HTTP error! status: ${response.status}`);
      console.error(`HTTP error on attempt ${i + 1}:`, lastError);
    } catch (error) {
      console.error(`Attempt ${i + 1} failed:`, error);
      lastError = error;
      
      if (error.name === 'AbortError') {
        console.error('Request timed out');
        throw new Error('Request timed out');
      }
      
      // Only retry if we haven't reached max retries
      if (i === maxRetries - 1) {
        console.error('Max retries reached, giving up');
        throw error;
      }
      
      // Exponential backoff
      const backoffTime = Math.pow(2, i) * 1000;
      console.log(`Waiting ${backoffTime}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, backoffTime));
    }
  }
  
  throw lastError;
}

export function addCorsHeaders(response: Response): Response {
  const responseWithCors = new Response(response.body, response);
  Object.entries(corsHeaders).forEach(([key, value]) => {
    responseWithCors.headers.set(key, value);
  });
  return responseWithCors;
}

export function getRealIp(req: Request): string {
  // Try to get the real IP from Cloudflare headers first
  const cfConnectingIp = req.headers.get('cf-connecting-ip');
  if (cfConnectingIp) return cfConnectingIp;

  // Fall back to x-forwarded-for
  const forwardedFor = req.headers.get('x-forwarded-for');
  if (forwardedFor) {
    // Get the first IP in the list
    const ips = forwardedFor.split(',');
    return ips[0].trim();
  }

  // Last resort: use the direct connection IP
  const directIp = req.headers.get('x-real-ip');
  return directIp || 'unknown';
}

export async function checkRateLimit(supabaseClient: any, ip: string): Promise<boolean> {
  const { data: rateLimit, error } = await supabaseClient
    .from('rate_limits')
    .select('*')
    .eq('ip', ip)
    .single();

  const now = new Date();

  if (error) {
    // No existing rate limit record found
    const { error: insertError } = await supabaseClient
      .from('rate_limits')
      .insert([{
        ip,
        requests_count: 1,
        window_start: now.toISOString(),
        last_request: now.toISOString()
      }]);

    if (insertError) {
      console.error('Error creating rate limit:', insertError);
      return false;
    }
    return true;
  }

  const windowStart = new Date(rateLimit.window_start);
  const minutesSinceStart = (now.getTime() - windowStart.getTime()) / (1000 * 60);

  if (minutesSinceStart >= 60) {
    // Reset window if it's expired
    const { error: updateError } = await supabaseClient
      .from('rate_limits')
      .update({
        requests_count: 1,
        window_start: now.toISOString(),
        last_request: now.toISOString()
      })
      .eq('ip', ip);

    if (updateError) {
      console.error('Error resetting rate limit:', updateError);
      return false;
    }
    return true;
  }

  if (rateLimit.requests_count >= 60) {
    return false;
  }

  // Increment request count
  const { error: updateError } = await supabaseClient
    .from('rate_limits')
    .update({
      requests_count: rateLimit.requests_count + 1,
      last_request: now.toISOString()
    })
    .eq('ip', ip);

  if (updateError) {
    console.error('Error updating rate limit:', updateError);
    return false;
  }

  return true;
}
