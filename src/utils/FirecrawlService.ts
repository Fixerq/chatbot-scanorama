import FirecrawlApp from '@mendable/firecrawl-js';

export class FirecrawlService {
  private static firecrawlApp: FirecrawlApp | null = null;
  private static MAX_API_LIMIT = 10;
  private static DEFAULT_LIMIT = 10;
  private static DIRECTORY_DOMAINS = [
    'yelp.com',
    'yellowpages.com',
    'angi.com',
    'angieslist.com',
    'checkatrade.com',
    'houzz.com',
    'thumbtack.com',
    'homeadvisor.com',
    'bark.com',
    'trustpilot.com',
    'bbb.org',
    'google.com/maps',
    'facebook.com/pages',
    'linkedin.com/company',
    'foursquare.com'
  ];

  static saveApiKey(apiKey: string): void {
    localStorage.setItem('firecrawl_api_key', apiKey);
    this.firecrawlApp = new FirecrawlApp({ apiKey });
  }

  static getApiKey(): string | null {
    return localStorage.getItem('firecrawl_api_key');
  }

  private static isDirectorySite(url: string): boolean {
    return this.DIRECTORY_DOMAINS.some(domain => url.toLowerCase().includes(domain));
  }

  static async crawlWebsite(url: string): Promise<{ success: boolean; error?: string; data?: any }> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      return { success: false, error: 'API key not found' };
    }

    if (this.isDirectorySite(url)) {
      return { success: false, error: 'Directory sites are not supported' };
    }

    try {
      console.log('Making crawl request to Firecrawl API');
      if (!this.firecrawlApp) {
        this.firecrawlApp = new FirecrawlApp({ apiKey });
      }

      const crawlResponse = await this.firecrawlApp.crawlUrl(url, {
        limit: 1,
        scrapeOptions: {
          formats: ['html'],
          timeout: 30000 // Increased timeout to 30 seconds
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
    limit: number = this.DEFAULT_LIMIT
  ): Promise<{ success: boolean; urls?: string[]; error?: string; hasMore?: boolean }> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      return { success: false, error: 'API key not found' };
    }

    try {
      if (!this.firecrawlApp) {
        this.firecrawlApp = new FirecrawlApp({ apiKey });
      }

      const searchQuery = `${query} ${country} ${region || ''}`.trim();
      console.log('Search query:', searchQuery);
      
      const requestLimit = Math.min(this.MAX_API_LIMIT, limit);
      const response = await this.firecrawlApp.search(searchQuery, { limit: requestLimit });
      console.log('Raw API response:', response);

      if (!response.success) {
        console.error('Search failed:', 'error' in response ? response.error : 'Unknown error');
        return { 
          success: false, 
          error: 'error' in response ? response.error : 'Search failed'
        };
      }

      // Filter out directory sites
      const filteredResults = response.data
        .filter(result => !this.isDirectorySite(result.url))
        .map(result => result.url);

      console.log('Filtered results:', filteredResults);

      if (filteredResults.length === 0) {
        return {
          success: false,
          error: 'No relevant websites found. Try adjusting your search terms.'
        };
      }

      const hasMore = response.data.length >= requestLimit;
      
      return { 
        success: true,
        urls: filteredResults.slice(0, limit),
        hasMore: hasMore
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
