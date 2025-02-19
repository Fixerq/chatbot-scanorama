
// Domain filtering logic
export const EXCLUDED_DOMAINS = [
  // Government domains (block all .gov sites)
  '.gov',
  
  // Educational institutions
  '.edu',
  'university',
  'college',
  'school',
  'academy',
  'institute',
  'campus',
  
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
  'maps.google.com',
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

export const EXCLUDED_PLACE_TYPES = [
  'university',
  'school',
  'secondary_school',
  'primary_school',
  'education',
  'library',
  'post_office',
  'local_government_office',
  'city_hall',
  'courthouse'
];

export const isExcludedDomain = (url: string): boolean => {
  // Return false if url is undefined or not a string
  if (!url || typeof url !== 'string') {
    console.log('Invalid URL provided to isExcludedDomain:', url);
    return false;
  }

  try {
    const lowerUrl = url.toLowerCase();
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();

    // First check for Google domains specifically
    if (hostname.includes('google.') || hostname === 'google.com') {
      console.log('Filtered out Google domain:', url);
      return true;
    }

    // Then check for .gov domains specifically
    if (hostname.includes('.gov')) {
      console.log('Filtered out .gov domain:', url);
      return true;
    }

    // Check other excluded domains
    const isExcluded = EXCLUDED_DOMAINS.some(domain => hostname.includes(domain.toLowerCase()));
    if (isExcluded) {
      console.log('Filtered out excluded domain:', url);
    }
    return isExcluded;
  } catch (error) {
    console.error('Error in isExcludedDomain:', error);
    return true; // Block invalid URLs
  }
};
