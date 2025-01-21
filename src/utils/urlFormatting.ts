export const formatUrl = (url: string) => {
  try {
    // Remove protocol (http:// or https://) if present
    let cleanUrl = url.replace(/^(https?:\/\/)/, '');
    
    // Get just the hostname (root domain)
    const hostname = cleanUrl.split('/')[0];
    
    // Remove any parameters or fragments
    const rootDomain = hostname.split('?')[0].split('#')[0];
    
    // Add back https:// for the actual link
    const fullUrl = url.startsWith('http') ? url : `https://${url}`;
    
    return {
      displayUrl: rootDomain,
      fullUrl: fullUrl
    };
  } catch (error) {
    console.error('Error formatting URL:', error);
    return {
      displayUrl: url,
      fullUrl: url.startsWith('http') ? url : `https://${url}`
    };
  }
};