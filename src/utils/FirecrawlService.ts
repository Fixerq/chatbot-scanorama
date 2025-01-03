import FirecrawlApp from '@mendable/firecrawl-js';

interface ErrorResponse {
  success: false;
  error: string;
}

interface SearchResponse {
  success: true;
  results: Array<{
    url: string;
    title?: string;
  }>;
}

type ApiResponse = SearchResponse | ErrorResponse;

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
      
      // Call the search method with just the query string
      const response = await this.firecrawlApp.search(searchQuery);
      console.log('Raw API response:', response);

      if (!response || !response.success) {
        console.error('Search failed:', response);
        return { 
          success: false, 
          error: (response as ErrorResponse)?.error || 'Failed to search websites' 
        };
      }

      // Safely check if results exists before mapping
      if (!response.results || !Array.isArray(response.results)) {
        console.error('Invalid response structure:', response);
        return {
          success: false,
          error: 'Invalid response from API'
        };
      }

      const urls = response.results.map(result => result.url);
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