
/**
 * URL validation and processing utilities
 */

// Known false positive domains
export const FALSE_POSITIVE_DOMAINS = [
  'kentdentists.com',
  'privategphealthcare.com',
  'dentalcaredirect.co.uk',
  'mydentist.co.uk',
  'dentist-special.com'
];

/**
 * Validates if a string is a valid URL
 */
export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url.startsWith('http') ? url : `https://${url}`);
    return true;
  } catch {
    return false;
  }
};

/**
 * Checks if a domain is in our false positives list
 */
export const isKnownFalsePositive = (url: string): boolean => {
  try {
    const domain = new URL(url.startsWith('http') ? url : `https://${url}`).hostname;
    return FALSE_POSITIVE_DOMAINS.some(falsePositive => 
      domain.includes(falsePositive) || domain === falsePositive
    );
  } catch {
    return false;
  }
};

/**
 * Formats a URL to ensure it has a proper protocol
 */
export const formatUrl = (url: string): string => {
  return url.startsWith('http') ? url : `https://${url}`;
};
