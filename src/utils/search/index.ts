
// Re-export from operations
export * from './operations';

// Re-export specific types for external use (using export type for isolatedModules)
export type { PlacesResult } from '@/types/search';

// Export the places search functionality
export { performApifySearch, loadMoreResults } from './apifyApiService';
export type { ApifySearchOptions, ApifySearchResponse } from './apifyApiService';
