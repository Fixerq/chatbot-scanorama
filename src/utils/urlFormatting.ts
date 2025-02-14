
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
    
    // Get the base URL (protocol + hostname)
    const baseUrl = `${urlObj.protocol}//${urlObj.hostname}`;
    
    // Use just the hostname for display
    const displayUrl = urlObj.hostname.replace(/^www\./, '');

    return {
      displayUrl,
      fullUrl: baseUrl
    };
  } catch (error) {
    console.error('Error formatting URL:', error);
    return {
      displayUrl: url,
      fullUrl: url.startsWith('http') ? url : `https://${url}`
    };
  }
};
