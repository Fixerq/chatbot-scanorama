
import { useState, useEffect, useCallback } from 'react';
import { Result } from '@/components/ResultsTable';
import { toast } from 'sonner';

export const useResultsState = (initialResults: Result[] = []) => {
  const [results, setResults] = useState<Result[]>(initialResults);
  const [filterValue, setFilterValue] = useState('all');
  const [sortValue, setSortValue] = useState('name');
  const [localPage, setLocalPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  const processResults = useCallback((newResults: Result[]) => {
    console.log('Processing new results:', newResults.length);
    try {
      const processedResults = newResults.map(result => ({
        ...result,
        url: result.url,
        business_name: result.business_name || result.details?.business_name || '',
        status: result.analysis_result?.status || result.status || 'pending',
        error: result.error || null,
        analysis_result: {
          has_chatbot: result.analysis_result?.has_chatbot || false,
          chatSolutions: result.analysis_result?.chatSolutions || [],
          status: result.analysis_result?.status || result.status || 'pending',
          lastChecked: result.analysis_result?.lastChecked || new Date().toISOString(),
          error: result.analysis_result?.error || null
        }
      }));

      return processedResults;
    } catch (error) {
      console.error('Error processing results:', error);
      toast.error('Error processing results');
      return [];
    }
  }, []);

  useEffect(() => {
    if (initialResults.length > 0) {
      console.log('Received new initial results:', initialResults.length);
      const processed = processResults(initialResults);
      setResults(processed);
      setIsLoading(false);
    }
  }, [initialResults, processResults]);

  const handleFilter = useCallback((value: string) => {
    setFilterValue(value);
    setLocalPage(1);
  }, []);

  const handleSort = useCallback((value: string) => {
    setSortValue(value);
  }, []);

  // Apply filters and sorting
  const filteredResults = results.filter(result => {
    if (filterValue === 'all') return true;
    if (filterValue === 'has_chatbot') return result.analysis_result?.has_chatbot;
    if (filterValue === 'analyzing') return result.status === 'analyzing' || result.analysis_result?.status === 'analyzing';
    return result.status === filterValue || result.analysis_result?.status === filterValue;
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
    isLoading,
    setResults
  };
};
