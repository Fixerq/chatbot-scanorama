import FirecrawlApp from '@mendable/firecrawl-js';
import { API_KEY_STORAGE_KEY } from './constants/firecrawl';
import { filterResults } from './helpers/searchHelpers';
import { ApiResponse, ErrorResponse, SearchResult } from './types/firecrawl';
import { supabase } from '@/integrations/supabase/client';

export class FirecrawlService {
  private static firecrawlApp: FirecrawlApp | null = null;
  private static MAX_API_LIMIT = 10; // Updated to respect API limit
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
    localStorage.setItem(API_KEY_STORAGE_KEY, apiKey);
    this.firecrawlApp = new FirecrawlApp({ apiKey });
  }

  static getApiKey(): string | null {
    return localStorage.getItem(API_KEY_STORAGE_KEY);
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
          formats: ['html']
        }
      });

      if (!crawlResponse.success) {
        console.error('Crawl failed:', 'error' in crawlResponse ? crawlResponse.error : 'Unknown error');
        return { 
          success: false, 
          error: 'error' in crawlResponse ? crawlResponse.error : 'Failed to crawl website'
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

      // Build search query with location filters
      const searchQuery = `${query} ${country} ${region || ''}`.trim();
      console.log('Search query:', searchQuery);
      
      // Ensure we don't exceed the API limit
      const requestLimit = Math.min(this.MAX_API_LIMIT, limit);
      let response = await this.firecrawlApp.search(searchQuery, { limit: requestLimit }) as ApiResponse;
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
        .filter(result => !this.isDirectorySite(result.url));

      console.log('Filtered results:', filteredResults);

      if (filteredResults.length === 0) {
        return {
          success: false,
          error: 'No relevant websites found. Try adjusting your search terms.'
        };
      }

      // Get previously analyzed URLs
      const { data: analyzedUrls } = await supabase
        .from('analyzed_urls')
        .select('url, status');

      const analyzedUrlSet = new Set(analyzedUrls?.map(item => item.url) || []);
      
      // Filter out already analyzed URLs
      const newUrls = filteredResults
        .filter(result => !analyzedUrlSet.has(result.url))
        .map(result => result.url);

      const hasMore = response.data.length >= requestLimit;
      
      return { 
        success: true,
        urls: newUrls.slice(0, limit),
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