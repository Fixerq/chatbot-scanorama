
import { Result } from '@/components/ResultsTable';

export const processPlacesResults = (results: Result[], existingResults: Result[] = []): Result[] => {
  if (!results?.length) {
    return existingResults;
  }

  // Create a map of existing results by URL for quick lookup
  const urlMap = new Map(existingResults.map(r => [r.url, r]));
  
  // Add or update with new results
  results.forEach(result => {
    if (!urlMap.has(result.url)) {
      urlMap.set(result.url, result);
    }
  });
  
  return Array.from(urlMap.values());
};
