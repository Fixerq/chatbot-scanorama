import FirecrawlApp from '@mendable/firecrawl-js';
import { API_KEY_STORAGE_KEY } from './constants/firecrawl';
import { filterResults } from './helpers/searchHelpers';
import { ApiResponse, ErrorResponse, SearchResult } from './types/firecrawl';
import { supabase } from '@/integrations/supabase/client';

export class FirecrawlService {
  private static firecrawlApp: FirecrawlApp | null = null;
  private static MAX_API_LIMIT = 10; // Updated to respect API limit
  private static DEFAULT_LIMIT = 10;

  static saveApiKey(apiKey: string): void {
    localStorage.setItem(API_KEY_STORAGE_KEY, apiKey);
    this.firecrawlApp = new FirecrawlApp({ apiKey });
  }

  static getApiKey(): string | null {
    return localStorage.getItem(API_KEY_STORAGE_KEY);
  }

  static async crawlWebsite(url: string): Promise<{ success: boolean; error?: string; data?: any }> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      return { success: false, error: 'API key not found' };
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
          selectors: ['script', 'link[rel="stylesheet"]', 'meta'],
        }
      });

      if (!crawlResponse.success) {
        console.error('Crawl failed:', crawlResponse.error);
        return { 
          success: false, 
          error: crawlResponse.error || 'Failed to crawl website' 
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

      const enhancedQuery = await this.enhanceSearchQuery(query, country, region);
      console.log('Enhanced search query:', enhancedQuery);
      
      // Ensure we don't exceed the API limit
      const requestLimit = Math.min(this.MAX_API_LIMIT, limit);
      let response = await this.firecrawlApp.search(enhancedQuery, { limit: requestLimit }) as ApiResponse;
      console.log('Raw API response:', response);

      if (!response.success || (response.success && (!response.data || response.data.length === 0))) {
        const simpleQuery = this.buildSearchQuery(query, country, region);
        console.log('Trying simple query:', simpleQuery);
        response = await this.firecrawlApp.search(simpleQuery, { limit: requestLimit }) as ApiResponse;
        console.log('Second attempt API response:', response);
      }

      if (!response.success) {
        console.error('Search failed:', (response as ErrorResponse).error);
        return { 
          success: false, 
          error: (response as ErrorResponse).error
        };
      }

      const filteredResults = filterResults(response.data, query, country, region);
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
