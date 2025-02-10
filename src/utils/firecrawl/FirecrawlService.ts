
import FirecrawlApp from '@mendable/firecrawl-js';
import { CrawlScrapeOptions, CrawlStatusResponse, ErrorResponse, CrawlResponse, CrawlFormat, CrawlDocument } from './types';
import { supabase } from '@/integrations/supabase/client';

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
  private static firecrawlApp: FirecrawlApp | null = null;
  private static MAX_API_LIMIT = 10;

  static async getApiKey(): Promise<string> {
    try {
      const { data, error } = await supabase.functions.invoke('get-secret', {
        body: { key: 'Firecrawl' }
      });

      if (error) {
        console.error('Error fetching Firecrawl API key:', error);
        throw new Error('Failed to fetch API key');
      }

      if (!data?.Firecrawl) {
        throw new Error('Firecrawl API key not found');
      }

      return data.Firecrawl;
    } catch (error) {
      console.error('Error getting Firecrawl API key:', error);
      throw error;
    }
  }

  private static async initializeApp(): Promise<void> {
    if (!this.firecrawlApp) {
      const apiKey = await this.getApiKey();
      this.firecrawlApp = new FirecrawlApp({ apiKey });
    }
  }

  private static formatUrl(url: string): string {
    try {
      // First, trim any whitespace
      let cleanUrl = url.trim();
      
      // Remove any trailing slashes or colons
      cleanUrl = cleanUrl.replace(/[:/]+$/, '');
      
      // If no protocol is specified, add https://
      if (!cleanUrl.match(/^https?:\/\//i)) {
        cleanUrl = 'https://' + cleanUrl;
      }
      
      // Parse URL to validate and normalize it
      const urlObj = new URL(cleanUrl);
      
      // Clean up the hostname (remove any extra colons)
      urlObj.hostname = urlObj.hostname.replace(/:/g, '');
      
      // Reconstruct the URL without any trailing slashes
      let finalUrl = `${urlObj.protocol}//${urlObj.hostname}${urlObj.pathname}${urlObj.search}${urlObj.hash}`;
      
      // Remove any double slashes in the path (except after protocol)
      finalUrl = finalUrl.replace(/([^:]\/)\/+/g, '$1');
      
      console.log('Formatted URL:', finalUrl);
      return finalUrl;
    } catch (error) {
      console.error('Invalid URL format:', error);
      throw new Error('Invalid URL format');
    }
  }

  static async crawlWebsite(url: string): Promise<{ success: boolean; error?: string; data?: any }> {
    try {
      console.log('Making crawl request to Firecrawl API');
      await this.initializeApp();

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
