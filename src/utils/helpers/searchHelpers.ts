import { DIRECTORY_DOMAINS, SERVICE_INDICATORS } from '../constants/firecrawl';
import { SearchResult } from '../types/firecrawl';

export const getBusinessKeywords = (query: string): string[] => {
  const businessType = query.toLowerCase();
  const commonKeywords = ['services', 'local', 'professional', 'licensed', 'insured', 'company', 'business'];
  
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
};

export const isDirectorySite = (url: string): boolean => {
  // Only filter out well-known directory sites
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
  // Make the keyword matching less strict by requiring only one keyword match
  return keywords.some(keyword => lowerContent.includes(keyword.toLowerCase()));
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

export const filterResults = (results: SearchResult[], query: string): SearchResult[] => {
  const keywords = getBusinessKeywords(query);
  
  return results.filter(result => {
    // Skip directory site check for now to get more results
    // if (isDirectorySite(result.url)) {
    //   console.log(`Filtered out directory site: ${result.url}`);
    //   return false;
    // }

    const contentToCheck = [
      result.title,
      result.description || ''
    ].join(' ').toLowerCase();

    // Make the filtering less strict by requiring only keywords OR indicators
    const hasKeywords = hasRelevantKeywords(contentToCheck, keywords);
    const hasIndicators = hasServiceIndicators(contentToCheck);
    const hasPhone = hasPhoneNumber(contentToCheck);

    // Changed from AND to OR to be less restrictive
    const isRelevant = hasKeywords || hasIndicators || hasPhone;
    
    if (!isRelevant) {
      console.log(`Filtered out non-relevant result: ${result.url}`);
    }

    return isRelevant;
  });
};