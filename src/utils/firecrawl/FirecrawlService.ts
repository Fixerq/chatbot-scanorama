import FirecrawlApp from '@mendable/firecrawl-js';
import { CrawlScrapeOptions, CrawlStatusResponse, ErrorResponse, CrawlResponse, CrawlFormat, CrawlDocument } from './types';

interface CrawlResult {
  success: boolean;
  status?: string;
  completed?: number;
  total?: number;
  creditsUsed?: number;
  expiresAt?: string;
  data?: CrawlDocument[];
  emails?: string[];
}

export class FirecrawlService {
  private static API_KEY = 'YOUR_FIRECRAWL_API_KEY';
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

  private static formatUrl(url: string): string {
    try {
      // Remove any trailing colons
      url = url.replace(/:$/, '');
      
      // If the URL doesn't start with http:// or https://, add https://
      if (!url.match(/^https?:\/\//i)) {
        url = 'https://' + url;
      }
      
      // Validate the URL
      new URL(url);
      return url;
    } catch (error) {
      console.error('Invalid URL format:', error);
      throw new Error('Invalid URL format');
    }
  }

  static async crawlWebsite(url: string): Promise<{ success: boolean; error?: string; data?: any }> {
    try {
      console.log('Making crawl request to Firecrawl API');
      this.initializeApp();

      // Format and validate the URL before making the request
      const formattedUrl = this.formatUrl(url);
      console.log('Formatted URL:', formattedUrl);

      const scrapeOptions: CrawlScrapeOptions = {
        formats: ["html" as CrawlFormat],
        timeout: 30000,
        selectors: {
          emails: {
            selector: 'a[href^="mailto:"]',
            type: 'text',
            attribute: 'href'
          }
        }
      };

      const crawlResponse = await this.firecrawlApp!.crawlUrl(formattedUrl, {
        limit: 1,
        scrapeOptions
      }) as CrawlResponse;

      if (!crawlResponse.success) {
        console.error('Crawl failed:', (crawlResponse as ErrorResponse).error);
        return { 
          success: false, 
          error: (crawlResponse as ErrorResponse).error || 'Failed to crawl website' 
        };
      }

      // Extract emails from the crawl response
      const emails = new Set<string>();
      if (crawlResponse.data && Array.isArray(crawlResponse.data)) {
        crawlResponse.data.forEach((item: CrawlDocument) => {
          if (item.selectors?.emails) {
            const extractedEmails = item.selectors.emails
              .map((email: string) => email.replace('mailto:', ''))
              .filter((email: string) => email.includes('@'));
            extractedEmails.forEach((email: string) => emails.add(email));
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