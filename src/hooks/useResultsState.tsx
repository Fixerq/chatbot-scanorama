
import { useState, useEffect } from 'react';
import { Result } from '@/components/ResultsTable';
import { toast } from 'sonner';

export const useResultsState = (initialResults: Result[] = []) => {
  const [results, setResults] = useState<Result[]>(initialResults);
  const [filterValue, setFilterValue] = useState('all');
  const [sortValue, setSortValue] = useState('name');
  const [localPage, setLocalPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    console.log('Processing new results:', initialResults);
    try {
      const processedResults = initialResults.map(result => ({
        ...result,
        url: result.url,
        business_name: result.business_name || result.details?.business_name || '',
        status: result.status || 'pending',
        error: result.error || null,
        analysis_result: {
          has_chatbot: result.analysis_result?.has_chatbot || false,
          chatSolutions: result.analysis_result?.chatSolutions || [],
          status: result.analysis_result?.status || 'pending',
          lastChecked: result.analysis_result?.lastChecked || new Date().toISOString(),
          error: result.analysis_result?.error || null
        }
      }));

      setResults(processedResults);
      setIsLoading(false);
    } catch (error) {
      console.error('Error processing results:', error);
      toast.error('Error processing results');
      setIsLoading(false);
    }
  }, [initialResults]);

  const handleFilter = (value: string) => {
    setFilterValue(value);
    setLocalPage(1);
  };

  const handleSort = (value: string) => {
    setSortValue(value);
  };

  // Apply filters and sorting
  const filteredResults = results.filter(result => {
    if (filterValue === 'all') return true;
    if (filterValue === 'has_chatbot') return result.analysis_result?.has_chatbot;
    return result.status === filterValue;
  });

  const sortedResults = [...filteredResults].sort((a, b) => {
    switch (sortValue) {
      case 'name':
        return (a.business_name || '').localeCompare(b.business_name || '');
      case 'url':
        return a.url.localeCompare(b.url);
      case 'status':
        return (a.status || 'pending').localeCompare(b.status || 'pending');
      default:
        return 0;
    }
  });

  return {
    filteredResults: sortedResults,
    filterValue,
    sortValue,
    localPage,
    setLocalPage,
    handleFilter,
    handleSort,
    isLoading
  };
};
