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
  emails?: string[];
}

type CrawlResponse = CrawlStatusResponse | ErrorResponse;

export class FirecrawlService {
  private static API_KEY = 'YOUR_FIRECRAWL_API_KEY'; // This will be replaced with the actual key
  private static firecrawlApp: FirecrawlApp | null = null;
  private static MAX_API_LIMIT = 10;

  static getApiKey(): string {
    return this.API_KEY;
  }

  private static initializeApp(): void {
    if (!this.firecrawlApp) {
      this.firecrawlApp = new FirecrawlApp({ apiKey: this.API_KEY });
    }
  }

  static async crawlWebsite(url: string): Promise<{ success: boolean; error?: string; data?: any }> {
    try {
      console.log('Making crawl request to Firecrawl API');
      this.initializeApp();

      const crawlResponse = await this.firecrawlApp!.crawlUrl(url, {
        limit: 1,
        scrapeOptions: {
          formats: ['html'],
          timeout: 30000,
          extractEmails: true // Enable email extraction
        }
      });

      if (!crawlResponse.success) {
        console.error('Crawl failed:', 'error' in crawlResponse ? crawlResponse.error : 'Unknown error');
        return { 
          success: false, 
          error: 'error' in crawlResponse ? crawlResponse.error : 'Failed to crawl website' 
        };
      }

      // Extract emails from the crawl response
      const emails = new Set<string>();
      if (crawlResponse.data && Array.isArray(crawlResponse.data)) {
        crawlResponse.data.forEach(item => {
          if (item.emails && Array.isArray(item.emails)) {
            item.emails.forEach((email: string) => emails.add(email));
          }
        });
      }

      console.log('Crawl successful:', crawlResponse);
      return { 
        success: true,
        data: {
          ...crawlResponse,
          emails: Array.from(emails)
        }
      };
    } catch (error) {
      console.error('Error during crawl:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to connect to Firecrawl API' 
      };
    }
  }
}