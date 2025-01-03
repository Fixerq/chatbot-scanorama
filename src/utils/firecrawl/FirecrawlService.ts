import FirecrawlApp from '@mendable/firecrawl-js';
import { API_CONSTANTS } from './config';
import { isDirectorySite, validateApiKey } from './validation';
import type { CrawlResponse, SearchOptions, ApiResponse } from './types';

export class FirecrawlService {
  private static firecrawlApp: FirecrawlApp | null = null;

  static saveApiKey(apiKey: string): void {
    localStorage.setItem(API_CONSTANTS.STORAGE_KEY, apiKey);
    this.firecrawlApp = new FirecrawlApp({ apiKey });
  }

  static getApiKey(): string | null {
    return localStorage.getItem(API_CONSTANTS.STORAGE_KEY);
  }

  private static initializeApp(apiKey: string): void {
    if (!this.firecrawlApp) {
      this.firecrawlApp = new FirecrawlApp({ apiKey });
    }
  }

  static async crawlWebsite(url: string): Promise<{ success: boolean; error?: string; data?: any }> {
    const apiKey = validateApiKey(this.getApiKey());
    if (!apiKey) {
      return { success: false, error: 'API key not found' };
    }

    if (isDirectorySite(url)) {
      return { success: false, error: 'Directory sites are not supported' };
    }

    try {
      console.log('Making crawl request to Firecrawl API');
      this.initializeApp(apiKey);

      const crawlResponse = await this.firecrawlApp!.crawlUrl(url, {
        limit: 1,
        scrapeOptions: {
          formats: ['html'],
          timeout: API_CONSTANTS.DEFAULT_TIMEOUT
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
    limit: number = API_CONSTANTS.DEFAULT_LIMIT
  ): Promise<{ success: boolean; urls?: string[]; error?: string; hasMore?: boolean }> {
    const apiKey = validateApiKey(this.getApiKey());
    if (!apiKey) {
      return { success: false, error: 'API key not found' };
    }

    try {
      this.initializeApp(apiKey);

      const searchQuery = `${query} ${country} ${region || ''}`.trim();
      console.log('Search query:', searchQuery);
      
      const requestLimit = Math.min(API_CONSTANTS.MAX_API_LIMIT, limit);
      const response = await this.firecrawlApp!.search(searchQuery, { limit: requestLimit });
      console.log('Raw API response:', response);

      if (!response.success) {
        console.error('Search failed:', 'error' in response ? response.error : 'Unknown error');
        return { 
          success: false, 
          error: 'error' in response ? response.error : 'Search failed'
        };
      }

      const filteredResults = response.data
        .filter(result => !isDirectorySite(result.url))
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