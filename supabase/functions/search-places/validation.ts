
import { SearchParams } from './types';

export const validateSearchParams = (params: SearchParams): string | null => {
  if (!params.query?.trim()) {
    return 'Missing required parameter: query';
  }

  if (!params.country?.trim()) {
    return 'Missing required parameter: country';
  }

  if (!params.region?.trim()) {
    return 'Missing required parameter: region';
  }

  return null;
};

export const validateSearchRequest = (action: string, params: any): string | null => {
  if (action !== 'search') {
    return 'Invalid action type';
  }

  if (!params) {
    return 'Missing search parameters';
  }

  return validateSearchParams(params as SearchParams);
};
