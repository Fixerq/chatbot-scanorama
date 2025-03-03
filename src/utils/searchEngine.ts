
import { performPlacesSearch } from './search/placesApiService';
import type { PlacesResult } from '@/types/search';

// Define the PlacesResult type here since it's not exported from the search module
export type { PlacesResult };

// Re-export the functionality to maintain backward compatibility
export { performPlacesSearch };
