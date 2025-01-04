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
    '.mil',
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
    'google.com',
    'facebook.com',
    'twitter.com',
    'instagram.com',
    'youtube.com',
    'reddit.com',
    'quora.com',
    'medium.com',
    'forbes.com',
    'bloomberg.com',
    'reuters.com',
    'cnbc.com',
    'cnn.com',
    'bbc.com',
    'nytimes.com',
    'washingtonpost.com',
    'wsj.com',
    'metlife.com',
    'insurance.',
    'bank.',
    'healthcare.gov',
    'medicare.gov',
    'medicaid.gov',
    'irs.gov',
    'usa.gov',
    'state.',
    'county.',
    'city.',
    'municipal.',
    'department',
    'agency',
    'bureau',
    'administration',
    'institute',
    'association',
    'foundation',
    'society',
    'organization',
    'nonprofit',
    'ngo'
  ];

  const lowerUrl = url.toLowerCase();
  return excludedDomains.some(domain => lowerUrl.includes(domain));
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
    'insured',
    'estimates',
    'consultation',
    'emergency service',
    '24/7',
    'same day',
    'satisfaction guaranteed',
    'locally owned',
    'locally operated',
    'years in business',
    'years of experience',
    'professional service',
    'reliable service',
    'trusted',
    'affordable'
  ];
  
  const matchCount = localServiceIndicators.filter(indicator => 
    lowerContent.includes(indicator.toLowerCase())
  ).length;

  // Require at least 3 service indicators
  return matchCount >= 3;
};

export const hasRelevantKeywords = (content: string, keywords: string[]): boolean => {
  const lowerContent = content.toLowerCase();
  const requiredKeywords = ['local', 'service', 'company', 'business'];
  
  // Require at least two required keywords and two specific keywords
  const requiredMatches = requiredKeywords.filter(keyword => lowerContent.includes(keyword)).length;
  const specificMatches = keywords.filter(keyword => lowerContent.includes(keyword.toLowerCase())).length;
  
  return requiredMatches >= 2 && specificMatches >= 2;
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
    'in the',
    'servicing',
    'covering'
  ];
  
  const hasLocationIndicator = locationIndicators.some(indicator => 
    lowerContent.includes(indicator)
  );
  
  // Check for region/country match with location indicator
  const hasLocation = hasLocationIndicator && (
    lowerContent.includes(lowerRegion) || 
    lowerContent.includes(lowerCountry)
  );

  // Also check for zip codes or area codes as additional location signals
  const hasZipCode = /\b\d{5}(-\d{4})?\b/.test(content);
  const hasAreaCode = /\(\d{3}\)/.test(content);

  return hasLocation || hasZipCode || hasAreaCode;
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
    // First, check for excluded domains - this is now more strict
    if (isDirectorySite(result.url) || isExcludedDomain(result.url)) {
      console.log(`Filtered out excluded domain: ${result.url}`);
      return false;
    }

    const contentToCheck = [
      result.title,
      result.description || '',
      result.url
    ].join(' ').toLowerCase();

    // Require multiple strong signals for a result to be considered a local business
    const hasKeywords = hasRelevantKeywords(contentToCheck, keywords);
    const hasLocation = hasLocationMatch(contentToCheck, country, region);
    const hasIndicators = hasServiceIndicators(contentToCheck);
    const hasPhone = hasPhoneNumber(contentToCheck);

    // Log the signals for debugging
    console.log(`Analyzing ${result.url}:`, {
      hasKeywords,
      hasLocation,
      hasIndicators,
      hasPhone,
      keywords: keywords,
      content: contentToCheck.substring(0, 200) + '...' // Log first 200 chars of content
    });

    // Now require at least 3 out of 4 signals AND no excluded domains
    const signals = [hasKeywords, hasLocation, hasIndicators, hasPhone];
    const signalCount = signals.filter(Boolean).length;
    const isLocalBusiness = signalCount >= 3;

    if (!isLocalBusiness) {
      console.log(`Filtered out non-local business: ${result.url} (${signalCount}/4 signals)`);
    }

    return isLocalBusiness;
  });
};