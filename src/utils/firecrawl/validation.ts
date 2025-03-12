
// This file is kept for backward compatibility
// The Firecrawl integration has been deprecated

export const isDirectorySite = (url: string): boolean => {
  return false;
};

export const validateApiKey = (apiKey: string | null): string | null => {
  console.log('Firecrawl integration is no longer supported');
  return null;
};
