import { DIRECTORY_DOMAINS, SERVICE_INDICATORS, BUSINESS_KEYWORDS } from '../constants/firecrawl';
import { SearchResult } from '../types/firecrawl';

export const getBusinessKeywords = (query: string): string[] => {
  const businessType = query.toLowerCase();
  const commonKeywords = ['services', 'local', 'professional', 'licensed', 'insured', 'company', 'business'];
  
  const specificKeywords = Object.entries(BUSINESS_KEYWORDS).find(([type]) => 
    businessType.includes(type)
  )?.[1] || [];

  return [...new Set([...specificKeywords, ...commonKeywords])];
};

export const isDirectorySite = (url: string): boolean => {
  return DIRECTORY_DOMAINS.some(domain => url.toLowerCase().includes(domain));
};

export const hasServiceIndicators = (content: string): boolean => {
  const lowerContent = content.toLowerCase();
  return SERVICE_INDICATORS.some(indicator => 
    lowerContent.includes(indicator.toLowerCase())
  );
};

export const hasRelevantKeywords = (content: string, keywords: string[]): boolean => {
  const lowerContent = content.toLowerCase();
  // Require at least one keyword match
  return keywords.some(keyword => lowerContent.includes(keyword.toLowerCase()));
};

export const hasLocationMatch = (content: string, country: string, region?: string): boolean => {
  const lowerContent = content.toLowerCase();
  const lowerCountry = country.toLowerCase();
  
  // Check for country match
  const hasCountry = lowerContent.includes(lowerCountry);
  
  // If no region specified, only check country
  if (!region) {
    return hasCountry;
  }
  
  // Check for region match if specified
  const lowerRegion = region.toLowerCase();
  const hasRegion = lowerContent.includes(lowerRegion);
  
  // Return true if either country or region matches (less strict)
  return hasCountry || hasRegion;
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
    if (isDirectorySite(result.url)) {
      console.log(`Filtered out directory site: ${result.url}`);
      return false;
    }

    const contentToCheck = [
      result.title,
      result.description || '',
      result.url
    ].join(' ').toLowerCase();

    // Modified filtering logic to be less strict
    const hasKeywords = hasRelevantKeywords(contentToCheck, keywords);
    const hasLocation = hasLocationMatch(contentToCheck, country, region);
    const hasIndicators = hasServiceIndicators(contentToCheck);
    const hasPhone = hasPhoneNumber(contentToCheck);

    // New relevancy scoring - require keywords and at least one other signal
    const isRelevant = hasKeywords && (hasLocation || hasIndicators || hasPhone);
    
    if (!isRelevant) {
      console.log(`Filtered out non-relevant result: ${result.url}`);
      console.log('Reasons:', {
        hasKeywords,
        hasIndicators,
        hasPhone,
        hasLocation
      });
    }

    return isRelevant;
  });
};