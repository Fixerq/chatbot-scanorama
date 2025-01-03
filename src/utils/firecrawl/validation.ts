import { DIRECTORY_DOMAINS } from './config';

export const isDirectorySite = (url: string): boolean => {
  return DIRECTORY_DOMAINS.some(domain => url.toLowerCase().includes(domain));
};

export const validateApiKey = (apiKey: string | null): string | null => {
  if (!apiKey) {
    console.error('API key not found');
    return null;
  }
  return apiKey;
};