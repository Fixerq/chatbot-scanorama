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
  private static retryCount = 0;
  private static MAX_RETRIES = 3;
  private static RETRY_DELAY = 1000;
  private static apiKey: string | null = null;
  private static lastAccessToken: string | null = null;

  private static async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  static async getApiKey(): Promise<string> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        console.log('No active session');
        return '';
      }

      // Return cached key if session hasn't changed
      if (this.apiKey && session.access_token === this.lastAccessToken) {
        return this.apiKey;
      }

      // Only attempt to fetch API key if we're authenticated
      console.log('Fetching API key');
      const { data, error } = await supabase.functions.invoke('search-places', {
        body: { type: 'get_api_key' },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (error) {
        if (this.retryCount < this.MAX_RETRIES) {
          console.log(`Retrying API key fetch`);
          this.retryCount++;
          await this.delay(this.RETRY_DELAY);
          return this.getApiKey();
        }
        console.error('API key fetch error');
        return '';
      }

      if (!data?.apiKey) {
        console.error('No API key in response');
        return '';
      }

      this.retryCount = 0;
      this.apiKey = data.apiKey;
      this.lastAccessToken = session.access_token;
      return data.apiKey;
    } catch (error) {
      console.error('API key error');
      return '';
    }
  }

  private static async initializeApp(): Promise<void> {
    if (!this.firecrawlApp) {
      try {
        const apiKey = await this.getApiKey();
        if (apiKey) {
          this.firecrawlApp = new FirecrawlApp({ apiKey });
        }
      } catch (error) {
        console.error('Initialization error');
      }
    }
  }

  private static formatUrl(url: string): string {
    try {
      let cleanUrl = url.trim();
      cleanUrl = cleanUrl.replace(/[:/]+$/, '');
      if (!cleanUrl.match(/^https?:\/\//i)) {
        cleanUrl = 'https://' + cleanUrl;
      }
      const urlObj = new URL(cleanUrl);
      urlObj.hostname = urlObj.hostname.replace(/:/g, '');
      let finalUrl = `${urlObj.protocol}//${urlObj.hostname}${urlObj.pathname}${urlObj.search}${urlObj.hash}`;
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

      if (!this.firecrawlApp) {
        return { success: false, error: 'Firecrawl not initialized' };
      }

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

      const crawlResponse = await this.firecrawlApp.crawlUrl(formattedUrl, {
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
