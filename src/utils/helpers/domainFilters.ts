// Domain filtering logic
export const EXCLUDED_DOMAINS = [
  // Government domains
  '.gov',
  '.mil',
  'whitehouse.gov',
  'usa.gov',
  'uscis.gov',
  'sba.gov',
  'secretservice.gov',
  
  // Educational institutions
  '.edu',
  
  // Non-profits and organizations
  'feedingamerica.org',
  'unitedway.org',
  'redcross.org',
  'salvation-army.org',
  
  // Job sites
  'linkedin.com',
  'indeed.com',
  'glassdoor.com',
  'monster.com',
  'careerbuilder.com',
  
  // Large corporations and platforms
  'microsoft.com',
  'apple.com',
  'google.com',
  'facebook.com',
  'amazon.com',
  
  // News and media
  'cnn.com',
  'bbc.com',
  'nytimes.com',
  'reuters.com',
  
  // Directories and review sites
  'yelp.com',
  'yellowpages.com',
  'bbb.org',
  'angi.com',
  'thumbtack.com'
];

export const isExcludedDomain = (url: string): boolean => {
  const lowerUrl = url.toLowerCase();
  return EXCLUDED_DOMAINS.some(domain => lowerUrl.includes(domain));
};