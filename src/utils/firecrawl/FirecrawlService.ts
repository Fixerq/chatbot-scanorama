import FirecrawlApp from '@mendable/firecrawl-js';

interface ErrorResponse {
  success: false;
  error: string;
}

interface CrawlStatusResponse {
  success: true;
  status: string;
  completed: number;
  total: number;
  creditsUsed: number;
  expiresAt: string;
  data: any[];
}

type CrawlResponse = CrawlStatusResponse | ErrorResponse;

export class FirecrawlService {
  private static API_KEY_STORAGE_KEY = 'firecrawl_api_key';
  private static firecrawlApp: FirecrawlApp | null = null;
  private static MAX_API_LIMIT = 10;

  static saveApiKey(apiKey: string): void {
    localStorage.setItem(this.API_KEY_STORAGE_KEY, apiKey);
    this.firecrawlApp = new FirecrawlApp({ apiKey });
  }

  static getApiKey(): string | null {
    return localStorage.getItem(this.API_KEY_STORAGE_KEY);
  }

  private static initializeApp(apiKey: string): void {
    if (!this.firecrawlApp) {
      this.firecrawlApp = new FirecrawlApp({ apiKey });
    }
  }

  static async crawlWebsite(url: string): Promise<{ success: boolean; error?: string; data?: any }> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      return { success: false, error: 'API key not found' };
    }

    try {
      console.log('Making crawl request to Firecrawl API');
      this.initializeApp(apiKey);

      const crawlResponse = await this.firecrawlApp!.crawlUrl(url, {
        limit: 1,
        scrapeOptions: {
          formats: ['html'],
          timeout: 30000
        }
      });

      if (!crawlResponse.success) {
        console.error('Crawl failed:', 'error' in crawlResponse ? crawlResponse.error : 'Unknown error');
        return { 
          success: false, 
          error: 'error' in crawlResponse ? crawlResponse.error : 'Failed to crawl website' 
        };
      }

      if (!crawlResponse.data?.[0]?.html) {
        return {
          success: false,
          error: 'No HTML content retrieved'
        };
      }

      console.log('Crawl successful:', crawlResponse);
      return { 
        success: true,
        data: crawlResponse 
      };
    } catch (error) {
      console.error('Error during crawl:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to connect to Firecrawl API' 
      };
    }
  }

  static async searchWebsites(
    query: string, 
    country: string, 
    region?: string, 
    limit: number = 10
  ): Promise<{ success: boolean; urls?: string[]; error?: string; hasMore?: boolean }> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      return { success: false, error: 'API key not found' };
    }

    try {
      this.initializeApp(apiKey);
      console.log('Search params:', { query, country, region, limit });

      const searchQuery = `${query} ${country} ${region || ''}`.trim();
      const requestLimit = Math.min(this.MAX_API_LIMIT, limit);

      const response = await this.firecrawlApp!.search(searchQuery, { 
        limit: requestLimit,
        options: {
          country: country,
          region: region || undefined
        }
      });

      if (!response.success) {
        console.error('Search failed:', 'error' in response ? response.error : 'Unknown error');
        return { 
          success: false, 
          error: 'error' in response ? response.error : 'Search failed'
        };
      }

      const urls = response.data.map(result => result.url);
      const hasMore = urls.length >= requestLimit;
      const limitedUrls = urls.slice(0, requestLimit);

      console.log('Search results:', {
        totalResults: urls.length,
        limitedResults: limitedUrls.length,
        hasMore
      });

      return { 
        success: true,
        urls: limitedUrls,
        hasMore
      };
    } catch (error) {
      console.error('Error during search:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to connect to Firecrawl API' 
      };
    }
  }
}