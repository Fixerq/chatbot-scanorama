
import { useState } from 'react';

export const useSearchParams = () => {
  const [lastSearchParams, setLastSearchParams] = useState<{
    query: string;
    country: string;
    region: string;
    apiKey: string;
    resultsLimit: number;
  } | null>(null);
  
  const updateSearchParams = (params: {
    query: string;
    country: string;
    region: string;
    apiKey: string;
    resultsLimit: number;
  }) => {
    setLastSearchParams(params);
  };
  
  return {
    lastSearchParams,
    updateSearchParams
  };
};
