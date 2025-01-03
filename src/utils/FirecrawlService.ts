import FirecrawlApp from '@mendable/firecrawl-js';

interface SearchResult {
  url: string;
  title: string;
  description?: string;
}

interface ErrorResponse {
  success: false;
  error: string;
}

interface SuccessResponse {
  success: true;
  data: SearchResult[];
  warning?: {
    _type: string;
    value: string;
  };
}

type ApiResponse = SuccessResponse | ErrorResponse;

export class FirecrawlService {
  private static API_KEY_STORAGE_KEY = 'firecrawl_api_key';
  private static firecrawlApp: FirecrawlApp | null = null;

  private static directoryDomains = [
    'yelp.com',
    'yellowpages.com',
    'angi.com',
    'angieslist.com',
    'checkatrade.com',
    'houzz.com',
    'thumbtack.com',
    'homeadvisor.com',
    'bark.com',
    'trustpilot.com',
    'bbb.org'
  ];

  private static serviceIndicators = [
    'our services',
    'contact us',
    'locations',
    'service area',
    'about us',
    'free quote',
    'emergency service',
    'book online',
    'schedule service'
  ];

  private static getBusinessKeywords(query: string): string[] {
    const businessType = query.toLowerCase();
    const commonKeywords = ['services', 'local', 'professional', 'licensed', 'insured'];
    
    const businessSpecificKeywords: Record<string, string[]> = {
      'plumber': ['plumbing', 'plumber', 'leak repair', 'pipe', 'drain', 'water heater'],
      'electrician': ['electrical', 'electrician', 'wiring', 'fuse', 'lighting', 'power'],
      'carpenter': ['carpentry', 'woodwork', 'furniture', 'cabinet', 'renovation'],
      'painter': ['painting', 'decorator', 'wall', 'interior', 'exterior'],
      'landscaper': ['landscaping', 'garden', 'lawn', 'outdoor', 'maintenance'],
      'roofer': ['roofing', 'roof repair', 'gutters', 'shingles', 'leak'],
      'hvac': ['heating', 'cooling', 'air conditioning', 'ventilation', 'furnace']
    };

    const matchedType = Object.keys(businessSpecificKeywords).find(type => 
      businessType.includes(type)
    );

    return matchedType 
      ? [...businessSpecificKeywords[matchedType], ...commonKeywords]
      : commonKeywords;
  }

  private static isDirectorySite(url: string): boolean {
    return this.directoryDomains.some(domain => url.toLowerCase().includes(domain));
  }

  private static hasServiceIndicators(content: string): boolean {
    const lowerContent = content.toLowerCase();
    return this.serviceIndicators.some(indicator => 
      lowerContent.includes(indicator.toLowerCase())
    );
  }

  private static hasRelevantKeywords(content: string, keywords: string[]): boolean {
    const lowerContent = content.toLowerCase();
    return keywords.some(keyword => lowerContent.includes(keyword.toLowerCase()));
  }

  private static hasPhoneNumber(content: string): boolean {
    const phonePatterns = [
      /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/,
      /\b\d{2}[-.]?\d{4}[-.]?\d{4}\b/,
      /\b\+\d{1,4}[-.]?\d{2,4}[-.]?\d{4}\b/
    ];
    
    return phonePatterns.some(pattern => pattern.test(content));
  }

  private static filterResults(results: SearchResult[], query: string): SearchResult[] {
    const keywords = this.getBusinessKeywords(query);
    
    return results.filter(result => {
      if (this.isDirectorySite(result.url)) {
        console.log(`Filtered out directory site: ${result.url}`);
        return false;
      }

      const contentToCheck = [
        result.title,
        result.description || ''
      ].join(' ').toLowerCase();

      const hasKeywords = this.hasRelevantKeywords(contentToCheck, keywords);
      const hasIndicators = this.hasServiceIndicators(contentToCheck);
      const hasPhone = this.hasPhoneNumber(contentToCheck);

      const isRelevant = hasKeywords && (hasIndicators || hasPhone);
      
      if (!isRelevant) {
        console.log(`Filtered out non-relevant result: ${result.url}`);
      }

      return isRelevant;
    });
  }

  static saveApiKey(apiKey: string): void {
    localStorage.setItem(this.API_KEY_STORAGE_KEY, apiKey);
    this.firecrawlApp = new FirecrawlApp({ apiKey });
  }

  static getApiKey(): string | null {
    return localStorage.getItem(this.API_KEY_STORAGE_KEY);
  }

  private static async enhanceSearchQuery(query: string, country: string): Promise<string> {
    try {
      const response = await fetch('/functions/enhance-search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query, country }),
      });

      if (!response.ok) {
        console.warn('Failed to enhance search query, using original query');
        return `${query} in ${country}`;
      }

      const data = await response.json();
      return data.enhancedQuery || `${query} in ${country}`;
    } catch (error) {
      console.warn('Error enhancing search query:', error);
      return `${query} in ${country}`;
    }
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

      const enhancedQuery = await this.enhanceSearchQuery(query, country);
      console.log('Enhanced search query:', enhancedQuery);
      
      const response = await this.firecrawlApp.search(enhancedQuery) as ApiResponse;
      console.log('Raw API response:', response);

      if (!response.success) {
        console.error('Search failed:', response.error);
        return { 
          success: false, 
          error: response.error
        };
      }

      const filteredResults = this.filterResults(response.data, query);
      console.log('Filtered results:', filteredResults);

      const urls = filteredResults.map(result => result.url);
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