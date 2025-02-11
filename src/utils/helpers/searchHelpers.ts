
import { SearchResult } from '../types/search';
import { isExcludedDomain } from './domainFilters';
import { 
  hasBusinessIndicators, 
  hasLocationMatch, 
  hasContactInfo 
} from './businessIndicators';

export const filterResults = (
  results: SearchResult[], 
  query: string, 
  country: string, 
  region?: string
): SearchResult[] => {
  return results.filter(result => {
    // First check: exclude non-business domains
    if (isExcludedDomain(result.url)) {
      console.log(`Filtered out excluded domain: ${result.url}`);
      return false;
    }

    const contentToCheck = [
      result.title,
      result.description,
      result.url
    ].join(' ');

    // Check for strong business signals
    const hasBusinessSignals = hasBusinessIndicators(contentToCheck);
    const hasLocation = hasLocationMatch(contentToCheck, country, region);
    const hasContact = hasContactInfo(contentToCheck);

    // Log the validation results for debugging
    console.log(`Analyzing ${result.url}:`, {
      hasBusinessSignals,
      hasLocation,
      hasContact,
      content: contentToCheck.substring(0, 200) + '...'
    });

    // Require ALL three signals for a result to be considered valid
    return hasBusinessSignals && hasLocation && hasContact;
  });
};
