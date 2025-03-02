
import { toast } from 'sonner';

/**
 * Validates search parameters
 */
export const validateSearchParams = (
  query: string,
  country: string
): boolean => {
  if (!query || query.trim().length < 2) {
    console.error('Search query too short');
    toast.error('Search query too short. Please provide a more specific search term.');
    return false;
  }
  
  if (!country) {
    console.error('Country not specified');
    toast.error('Please select a country for your search.');
    return false;
  }

  return true;
};
