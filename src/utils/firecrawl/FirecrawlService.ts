
// This is a stub implementation that was kept to maintain compatibility
// The Firecrawl integration has been deprecated

export class FirecrawlService {
  private static API_KEY = '';

  static getApiKey(): string {
    return this.API_KEY;
  }

  static saveApiKey(apiKey: string): void {
    console.log('Firecrawl integration is no longer supported');
  }

  static async crawlWebsite(url: string): Promise<{ success: boolean; error?: string; data?: any }> {
    console.log('Firecrawl integration is no longer supported');
    return { 
      success: false, 
      error: 'Firecrawl integration has been deprecated'
    };
  }
}
