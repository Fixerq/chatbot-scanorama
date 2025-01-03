import FirecrawlApp from '@mendable/firecrawl-js';

interface ErrorResponse {
  success: false;
  error: string;
}

interface SearchResult {
  url: string;
  title?: string;
}

interface SuccessResponse {
  success: true;
  data: {
    results: SearchResult[];
  };
}

type ApiResponse = SuccessResponse | ErrorResponse;

export class FirecrawlService {
  private static API_KEY_STORAGE_KEY = 'firecrawl_api_key';
  private static firecrawlApp: FirecrawlApp | null = null;

  static saveApiKey(apiKey: string): void {
    localStorage.setItem(this.API_KEY_STORAGE_KEY, apiKey);
    this.firecrawlApp = new FirecrawlApp({ apiKey });
  }

  static getApiKey(): string | null {
    return localStorage.getItem(this.API_KEY_STORAGE_KEY);
  }

  static async searchWebsites(query: string, country: string): Promise<{ success: boolean; urls?: string[]; error?: string }> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      return { success: false, error: 'API key not found' };
    }

    try {
      if (!this.firecrawlApp) {
        this.firecrawlApp = new FirecrawlApp({ apiKey });
      }

      const searchQuery = `${query} in ${country}`;
      console.log('Making search request with query:', searchQuery);
      
      const response = await this.firecrawlApp.search(searchQuery) as ApiResponse;
      console.log('Raw API response:', response);

      if (!response.success) {
        // Now TypeScript knows this is an ErrorResponse
        console.error('Search failed:', response.error);
        return { 
          success: false, 
          error: response.error
        };
      }

      // At this point, TypeScript knows response is SuccessResponse
      const results = response.data?.results;
      if (!results || !Array.isArray(results)) {
        console.error('Invalid response structure:', response);
        return {
          success: false,
          error: 'Invalid response structure from API'
        };
      }

      const urls = results.map(result => result.url);
      console.log('Processed URLs:', urls);
      
      return { 
        success: true,
        urls 
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