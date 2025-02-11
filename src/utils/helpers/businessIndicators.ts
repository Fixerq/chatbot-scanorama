
// Business validation logic
export const LOCAL_BUSINESS_INDICATORS = [
  'local business',
  'family owned',
  'serving',
  'licensed',
  'insured',
  'free estimate',
  'service area',
  'emergency service',
  'satisfaction guaranteed',
  'locally owned',
  'locally operated',
  'years in business',
  'professional service',
  'reliable service',
  'trusted',
  'affordable'
];

export const hasBusinessIndicators = (content: string): boolean => {
  const lowerContent = content.toLowerCase();
  const matchCount = LOCAL_BUSINESS_INDICATORS.filter(indicator => 
    lowerContent.includes(indicator)
  ).length;
  
  // Require at least 4 business indicators for stronger validation
  return matchCount >= 4;
};

export const hasLocationMatch = (content: string, country: string, region?: string): boolean => {
  const lowerContent = content.toLowerCase();
  const lowerCountry = country.toLowerCase();
  const lowerRegion = region?.toLowerCase() || '';
  
  // Check for specific location patterns
  const hasZipCode = /\b\d{5}(-\d{4})?\b/.test(content);
  const hasAreaCode = /\(\d{3}\)/.test(content);
  const hasAddress = /\d+\s+[A-Za-z\s]+(?:street|st|avenue|ave|road|rd|boulevard|blvd|lane|ln|drive|dr)\b/i.test(content);
  
  // Check for location keywords with country/region
  const locationKeywords = ['located in', 'based in', 'serving', 'local to'];
  const hasLocationKeyword = locationKeywords.some(keyword => 
    lowerContent.includes(`${keyword} ${lowerRegion}`) || 
    lowerContent.includes(`${keyword} ${lowerCountry}`)
  );
  
  // Return true if we have strong location signals
  return (hasZipCode || hasAreaCode || hasAddress) && hasLocationKeyword;
};

export const hasContactInfo = (content: string): boolean => {
  // Check for phone numbers
  const phonePatterns = [
    /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/,  // 123-456-7890
    /\b\(\d{3}\)[-.]?\d{3}[-.]?\d{4}\b/,  // (123)-456-7890
    /\b\+\d{1,4}[-.]?\d{2,4}[-.]?\d{4}\b/ // International format
  ];
  
  // Check for email patterns
  const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
  
  // Check for contact form indicators
  const contactFormPatterns = [
    'contact us',
    'get in touch',
    'request quote',
    'schedule service',
    'book appointment'
  ];
  
  const hasPhone = phonePatterns.some(pattern => pattern.test(content));
  const hasEmail = emailPattern.test(content);
  const hasContactForm = contactFormPatterns.some(pattern => 
    content.toLowerCase().includes(pattern)
  );
  
  // Require at least two types of contact information
  return [hasPhone, hasEmail, hasContactForm].filter(Boolean).length >= 2;
};
