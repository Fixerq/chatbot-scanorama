
import { performPlacesSearch } from './search/placesApiService';
import type { PlacesResult } from '@/types/search';

// Export the PlacesResult type
export type { PlacesResult };

// Re-export the functionality to maintain backward compatibility
export { performPlacesSearch };
