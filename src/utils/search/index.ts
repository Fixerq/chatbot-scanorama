
// Re-export from operations
export * from './operations';

// Re-export specific types for external use (using export type for isolatedModules)
export type { PlacesResult } from '@/types/search';

// Export the places search functionality
export { performPlacesSearch, loadMoreResults } from './placesApiService';
export type { PlacesSearchOptions, PlacesSearchResponse } from './placesApiService';
