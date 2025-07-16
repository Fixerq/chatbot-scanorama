
import { performApifySearch } from './search/apifyApiService';
import type { PlacesResult } from '@/types/search';

// Export the PlacesResult type
export type { PlacesResult };

// Re-export the functionality to maintain backward compatibility
export { performApifySearch };
