
import { performPlacesSearch } from './search';

// Define the PlacesResult type here since it's not exported from the search module
export interface PlacesResult {
  id?: string;
  url: string;
  status?: string;
  details?: {
    title?: string;
    description?: string;
    lastChecked?: string;
    chatSolutions?: string[];
    confidence?: number;
    verificationStatus?: string;
  };
}

// Re-export the functionality to maintain backward compatibility
export { performPlacesSearch };
