
export const formatUrl = (url: string) => {
  try {
    // Handle empty or invalid URLs
    if (!url) {
      return {
        displayUrl: '',
        fullUrl: ''
      };
    }

    // Create URL object to parse the URL properly
    const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
    
    // Get the root domain by removing www. prefix
    const rootDomain = urlObj.hostname.replace(/^www\./, '').toLowerCase();
    
    // Use just the root domain for both display and full URL
    return {
      displayUrl: rootDomain,
      fullUrl: `https://${rootDomain}`
    };
  } catch (error) {
    console.error('Error formatting URL:', error);
    return {
      displayUrl: url,
      fullUrl: url.startsWith('http') ? url : `https://${url}`
    };
  }
};
