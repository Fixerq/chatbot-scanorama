import { Result } from '@/components/ResultsTable';
import { performPlacesSearch } from '../placesApiService';
import { toast } from 'sonner';
import { enhanceSearchQuery } from './enhancer';
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

  // Enhance the search query
  const enhancedQuery = enhanceSearchQuery(query);

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
