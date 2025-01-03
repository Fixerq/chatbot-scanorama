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

  // Directory sites to exclude
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

  // Service-related phrases to look for
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

  // Dynamic keyword generation based on business type
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

    // Extract the business type from the query
    const matchedType = Object.keys(businessSpecificKeywords).find(type => 
      businessType.includes(type)
    );

    return matchedType 
      ? [...businessSpecificKeywords[matchedType], ...commonKeywords]
      : commonKeywords;
  }

  // Check if URL is from a directory site
  private static isDirectorySite(url: string): boolean {
    return this.directoryDomains.some(domain => url.toLowerCase().includes(domain));
  }

  // Check if content contains service indicators
  private static hasServiceIndicators(content: string): boolean {
    const lowerContent = content.toLowerCase();
    return this.serviceIndicators.some(indicator => 
      lowerContent.includes(indicator.toLowerCase())
    );
  }

  // Check if content contains business-relevant keywords
  private static hasRelevantKeywords(content: string, keywords: string[]): boolean {
    const lowerContent = content.toLowerCase();
    return keywords.some(keyword => lowerContent.includes(keyword.toLowerCase()));
  }

  // Check for phone number patterns (international format support)
  private static hasPhoneNumber(content: string): boolean {
    const phonePatterns = [
      /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/, // US/CA: 123-456-7890
      /\b\d{2}[-.]?\d{4}[-.]?\d{4}\b/, // UK: 02 1234 5678
      /\b\+\d{1,4}[-.]?\d{2,4}[-.]?\d{4}\b/ // International: +XX XXX XXXX
    ];
    
    return phonePatterns.some(pattern => pattern.test(content));
  }

  // Filter search results
  private static filterResults(results: SearchResult[], query: string): SearchResult[] {
    const keywords = this.getBusinessKeywords(query);
    
    return results.filter(result => {
      // Skip directory sites
      if (this.isDirectorySite(result.url)) {
        console.log(`Filtered out directory site: ${result.url}`);
        return false;
      }

      const contentToCheck = [
        result.title,
        result.description || ''
      ].join(' ').toLowerCase();

      // Check for relevant content indicators
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
        console.error('Search failed:', response.error);
        return { 
          success: false, 
          error: response.error
        };
      }

      // Filter the results
      const filteredResults = this.filterResults(response.data, query);
      console.log('Filtered results:', filteredResults);

      // Extract URLs from the filtered search results
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