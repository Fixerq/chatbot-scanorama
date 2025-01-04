import { DIRECTORY_DOMAINS, SERVICE_INDICATORS, BUSINESS_KEYWORDS } from '../constants/firecrawl';
import { SearchResult } from '../types/firecrawl';

export const getBusinessKeywords = (query: string): string[] => {
  const businessType = query.toLowerCase();
  const commonKeywords = ['local', 'business', 'company', 'service', 'contractor', 'provider'];
  
  const specificKeywords = Object.entries(BUSINESS_KEYWORDS).find(([type]) => 
    businessType.includes(type)
  )?.[1] || [];

  return [...new Set([...specificKeywords, ...commonKeywords])];
};

export const isDirectorySite = (url: string): boolean => {
  return DIRECTORY_DOMAINS.some(domain => url.toLowerCase().includes(domain));
};

export const isExcludedDomain = (url: string): boolean => {
  const excludedDomains = [
    '.gov',
    '.edu',
    'linkedin.com',
    'indeed.com',
    'glassdoor.com',
    'monster.com',
    'careerbuilder.com',
    'wikipedia.org',
    'support.',
    'help.',
    'docs.',
    'military',
    'veterans',
    'news.',
    'blog.',
    'wikipedia.',
    'amazon.com',
    'apple.com',
    'microsoft.com',
    'google.com'
  ];

  return excludedDomains.some(domain => url.toLowerCase().includes(domain));
};

export const hasServiceIndicators = (content: string): boolean => {
  const lowerContent = content.toLowerCase();
  const localServiceIndicators = [
    'our services',
    'contact us',
    'service area',
    'free quote',
    'book online',
    'schedule service',
    'get in touch',
    'request service',
    'call us',
    'local service',
    'family owned',
    'serving',
    'licensed',
    'insured'
  ];
  
  return localServiceIndicators.some(indicator => 
    lowerContent.includes(indicator.toLowerCase())
  );
};

export const hasRelevantKeywords = (content: string, keywords: string[]): boolean => {
  const lowerContent = content.toLowerCase();
  const requiredKeywords = ['local', 'service', 'company', 'business'];
  
  // Require at least one required keyword and one specific keyword
  const hasRequired = requiredKeywords.some(keyword => lowerContent.includes(keyword));
  const hasSpecific = keywords.some(keyword => lowerContent.includes(keyword.toLowerCase()));
  
  return hasRequired && hasSpecific;
};

export const hasLocationMatch = (content: string, country: string, region?: string): boolean => {
  const lowerContent = content.toLowerCase();
  const lowerCountry = country.toLowerCase();
  const lowerRegion = region?.toLowerCase() || '';
  
  // Check for specific location indicators
  const locationIndicators = [
    'serving',
    'located in',
    'based in',
    'service area',
    'local to',
    'near',
    'in the'
  ];
  
  const hasLocationIndicator = locationIndicators.some(indicator => 
    lowerContent.includes(indicator)
  );
  
  // Check for region/country match with location indicator
  return hasLocationIndicator && (
    lowerContent.includes(lowerRegion) || 
    lowerContent.includes(lowerCountry)
  );
};

export const hasPhoneNumber = (content: string): boolean => {
  const phonePatterns = [
    /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/,  // US/CA: 123-456-7890
    /\b\d{2}[-.]?\d{4}[-.]?\d{4}\b/,  // UK: 12-3456-7890
    /\b\+\d{1,4}[-.]?\d{2,4}[-.]?\d{4}\b/, // International: +1-234-567-8900
    /\b\d{5}[-.]?\d{6}\b/,  // Alternative format: 12345-123456
    /\b\(\d{3}\)[-.]?\d{3}[-.]?\d{4}\b/  // (123)-456-7890
  ];
  
  return phonePatterns.some(pattern => pattern.test(content));
};

export const filterResults = (
  results: SearchResult[], 
  query: string, 
  country: string, 
  region?: string
): SearchResult[] => {
  const keywords = getBusinessKeywords(query);
  
  return results.filter(result => {
    // First, check for excluded domains
    if (isDirectorySite(result.url) || isExcludedDomain(result.url)) {
      console.log(`Filtered out excluded domain: ${result.url}`);
      return false;
    }

    const contentToCheck = [
      result.title,
      result.description || '',
      result.url
    ].join(' ').toLowerCase();

    // Require multiple signals for a result to be considered a local business
    const hasKeywords = hasRelevantKeywords(contentToCheck, keywords);
    const hasLocation = hasLocationMatch(contentToCheck, country, region);
    const hasIndicators = hasServiceIndicators(contentToCheck);
    const hasPhone = hasPhoneNumber(contentToCheck);

    // Require at least 3 out of 4 signals
    const signals = [hasKeywords, hasLocation, hasIndicators, hasPhone];
    const signalCount = signals.filter(Boolean).length;
    const isLocalBusiness = signalCount >= 3;

    if (!isLocalBusiness) {
      console.log(`Filtered out non-local business: ${result.url}`);
      console.log('Signals:', {
        hasKeywords,
        hasLocation,
        hasIndicators,
        hasPhone,
        signalCount
      });
    }

    return isLocalBusiness;
  });
};