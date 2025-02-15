
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
    const rootDomain = urlObj.hostname.replace(/^www\./, '');
    
    // Use just the root domain for display and full URL
    const displayUrl = rootDomain;
    const fullUrl = `${urlObj.protocol}//${rootDomain}`;

    return {
      displayUrl,
      fullUrl
    };
  } catch (error) {
    console.error('Error formatting URL:', error);
    return {
      displayUrl: url,
      fullUrl: url.startsWith('http') ? url : `https://${url}`
    };
  }
};
