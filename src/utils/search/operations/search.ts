
import { Result } from '@/components/ResultsTable';
import { performPlacesSearch } from '../placesApiService';
import { toast } from 'sonner';
import { validateSearchParams } from './validator';

/**
 * Performs a search and handles validation, enhancement, and error handling.
 */
export const performSearch = async (
  query: string,
  country: string,
  region: string,
  existingPlaceIds?: string[]
): Promise<{ results: Result[]; nextPageToken?: string; hasMore: boolean } | null> => {
  // Validate search parameters
  const validationError = validateSearchParams(query, country);
  if (validationError) {
    toast.error(validationError);
    return null;
  }

  // No need to call enhanceSearchQuery since we're using the raw query
  // Just use the original query directly
  const enhancedQuery = query;

  // Perform the places search
  const searchResult = await performPlacesSearch({
    query: enhancedQuery,
    country,
    region,
    existingPlaceIds
  });

  if (!searchResult) {
    return null;
  }

  return searchResult;
};
