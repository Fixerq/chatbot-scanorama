import { toast } from 'sonner';

export const useSearchValidation = () => {
  const validateResults = (results: any[], url: string) => {
    if (!results || results.length === 0) {
      console.log('No valid results found for:', url);
      return false;
    }
    return true;
  };

  const validateSearchParams = (query: string, country: string) => {
    if (!query.trim()) {
      toast.error('Please enter a search query');
      return false;
    }

    if (!country) {
      toast.error('Please select a country');
      return false;
    }

    return true;
  };

  return {
    validateResults,
    validateSearchParams
  };
};