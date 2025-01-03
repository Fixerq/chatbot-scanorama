import { DIRECTORY_DOMAINS, SERVICE_INDICATORS } from '../constants/firecrawl';
import { SearchResult } from '../types/firecrawl';

export const getBusinessKeywords = (query: string): string[] => {
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
  return keywords.some(keyword => lowerContent.includes(keyword.toLowerCase()));
};

export const hasPhoneNumber = (content: string): boolean => {
  const phonePatterns = [
    /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/,
    /\b\d{2}[-.]?\d{4}[-.]?\d{4}\b/,
    /\b\+\d{1,4}[-.]?\d{2,4}[-.]?\d{4}\b/
  ];
  
  return phonePatterns.some(pattern => pattern.test(content));
};

export const filterResults = (results: SearchResult[], query: string): SearchResult[] => {
  const keywords = getBusinessKeywords(query);
  
  return results.filter(result => {
    if (isDirectorySite(result.url)) {
      console.log(`Filtered out directory site: ${result.url}`);
      return false;
    }

    const contentToCheck = [
      result.title,
      result.description || ''
    ].join(' ').toLowerCase();

    const hasKeywords = hasRelevantKeywords(contentToCheck, keywords);
    const hasIndicators = hasServiceIndicators(contentToCheck);
    const hasPhone = hasPhoneNumber(contentToCheck);

    const isRelevant = hasKeywords && (hasIndicators || hasPhone);
    
    if (!isRelevant) {
      console.log(`Filtered out non-relevant result: ${result.url}`);
    }

    return isRelevant;
  });
};