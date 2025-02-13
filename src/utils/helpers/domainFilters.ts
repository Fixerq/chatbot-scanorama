
// Domain filtering logic
export const EXCLUDED_DOMAINS = [
  // Government domains (block all .gov sites)
  '.gov',
  
  // Educational institutions
  '.edu',
  
  // Non-profits and organizations
  '.org',
  
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
  // Return false if url is undefined or not a string
  if (!url || typeof url !== 'string') {
    console.log('Invalid URL provided to isExcludedDomain:', url);
    return false;
  }

  try {
    const lowerUrl = url.toLowerCase();
    // First check for .gov domains specifically
    if (lowerUrl.includes('.gov')) {
      console.log('Filtered out .gov domain:', url);
      return true;
    }
    // Then check for other excluded domains
    const isExcluded = EXCLUDED_DOMAINS.some(domain => lowerUrl.includes(domain));
    if (isExcluded) {
      console.log('Filtered out excluded domain:', url);
    }
    return isExcluded;
  } catch (error) {
    console.error('Error in isExcludedDomain:', error);
    return false;
  }
};

