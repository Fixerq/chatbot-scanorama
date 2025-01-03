import FirecrawlApp from '@mendable/firecrawl-js';
import { API_KEY_STORAGE_KEY } from './constants/firecrawl';
import { filterResults } from './helpers/searchHelpers';
import { ApiResponse, ErrorResponse, SearchResult } from './types/firecrawl';
import { supabase } from '@/integrations/supabase/client';

export class FirecrawlService {
  private static firecrawlApp: FirecrawlApp | null = null;
  private static DEFAULT_LIMIT = 10;

  static saveApiKey(apiKey: string): void {
    localStorage.setItem(API_KEY_STORAGE_KEY, apiKey);
    this.firecrawlApp = new FirecrawlApp({ apiKey });
  }

  static getApiKey(): string | null {
    return localStorage.getItem(API_KEY_STORAGE_KEY);
  }

  private static async enhanceSearchQuery(query: string, country: string, region?: string): Promise<string> {
    try {
      const { data, error } = await supabase.functions.invoke('enhance-search', {
        body: { query, country, region }
      });

      if (error) {
        console.warn('Failed to enhance search query:', error);
        return this.buildSearchQuery(query, country, region);
      }

      return data?.enhancedQuery || this.buildSearchQuery(query, country, region);
    } catch (error) {
      console.warn('Error enhancing search query:', error);
      return this.buildSearchQuery(query, country, region);
    }
  }

  private static buildSearchQuery(query: string, country: string, region?: string): string {
    const locationString = region ? `${region}, ${country}` : country;
    const businessTerms = [
      'business',
      'company',
      'service',
      'professional',
      'local'
    ];

    const queryParts = [
      query,
      locationString,
      ...businessTerms
    ];

    return queryParts.join(' ');
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
      
      // Request more results than needed to ensure we have enough after filtering
      const requestLimit = Math.min(limit * 2, 100);
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

      const urls = filteredResults.map(result => result.url);
      const hasMore = urls.length > limit;
      
      return { 
        success: true,
        urls: urls.slice(0, limit),
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
