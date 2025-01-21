const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0'
];

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

export async function fetchWithRetry(url: string, maxRetries = 3, timeout = 30000): Promise<Response> {
  let lastError;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      console.log(`Attempt ${i + 1} for URL: ${url}`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      const response = await fetch(url, { 
        headers: getHeaders(i),
        redirect: 'follow',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      if (response.ok) {
        console.log(`Successfully fetched ${url} on attempt ${i + 1}`);
        return response;
      }
      
      // Handle specific status codes
      if (response.status === 404) {
        throw new Error('Page not found');
      }
      
      if (response.status === 403 || response.status === 401) {
        console.log('Access denied, trying with different user agent...');
        if (i === maxRetries - 1) {
          throw new Error('Website blocks automated access');
        }
        continue;
      }
      
      if (response.status === 503 || response.status === 502) {
        console.log('Service temporarily unavailable, retrying...');
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
        continue;
      }
      
      lastError = new Error(`HTTP error! status: ${response.status}`);
    } catch (error) {
      console.error(`Attempt ${i + 1} failed:`, error);
      lastError = error;
      
      if (error.name === 'AbortError') {
        console.log('Request timed out, retrying...');
      }
      
      if (i === maxRetries - 1) throw error;
      
      const delay = Math.pow(2, i) * 1000;
      console.log(`Waiting ${delay}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
}