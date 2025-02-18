
import { useState, useEffect } from 'react';
import { Result } from '@/components/ResultsTable';
import { toast } from 'sonner';

export const useResultsState = (initialResults: Result[] = []) => {
  const [filteredResults, setFilteredResults] = useState<Result[]>(initialResults);
  const [filterValue, setFilterValue] = useState('all');
  const [sortValue, setSortValue] = useState('name');
  const [localPage, setLocalPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    console.log('Initial results received:', initialResults);
    try {
      // Process results and ensure all required fields are present
      let updatedResults = initialResults.map(result => ({
        ...result,
        url: result.details?.website_url || result.url || '',
        business_name: result.details?.business_name || result.business_name || '',
        status: result.status || 'pending',
        error: result.error,
        analysis_result: {
          ...result.analysis_result,
          has_chatbot: result.analysis_result?.has_chatbot || false,
          chatSolutions: result.analysis_result?.chatSolutions || [],
          status: result.analysis_result?.status || 'pending',
          lastChecked: result.analysis_result?.lastChecked || new Date().toISOString()
        }
      }));

      // Only update state if results have meaningfully changed
      const currentResultsStr = JSON.stringify(filteredResults);
      const updatedResultsStr = JSON.stringify(updatedResults);
      
      if (currentResultsStr !== updatedResultsStr) {
        console.log('Updating filtered results with new data:', updatedResults);
        setFilteredResults(updatedResults);
        setLocalPage(1);
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error('Error processing results:', error);
      toast.error('Error processing results');
      setIsLoading(false);
    }
  }, [initialResults]);

  const handleFilter = (value: string) => {
    console.log('Applying filter:', value);
    try {
      setFilterValue(value);
      let filtered = [...initialResults];
      
      // Apply filters based on status or chatbot presence
      if (value !== 'all') {
        filtered = filtered.filter(result => {
          if (value === 'has_chatbot') return result.analysis_result?.has_chatbot;
          return result.status === value;
        });
      }
      
      setFilteredResults(filtered);
      setLocalPage(1);
    } catch (error) {
      console.error('Error applying filter:', error);
      toast.error('Error filtering results');
    }
  };

  const handleSort = (value: string) => {
    console.log('Applying sort:', value);
    try {
      setSortValue(value);
      let sorted = [...filteredResults];
      
      switch (value) {
        case 'name':
          sorted.sort((a, b) => {
            const nameA = a.details?.business_name || a.business_name || '';
            const nameB = b.details?.business_name || b.business_name || '';
            return nameA.localeCompare(nameB);
          });
          break;
        case 'url':
          sorted.sort((a, b) => {
            const urlA = a.details?.website_url || a.url || '';
            const urlB = b.details?.website_url || b.url || '';
            return urlA.localeCompare(urlB);
          });
          break;
        case 'status':
          sorted.sort((a, b) => {
            const statusA = a.analysis_result?.status || 'pending';
            const statusB = b.analysis_result?.status || 'pending';
            return statusA.localeCompare(statusB);
          });
          break;
      }
      
      setFilteredResults(sorted);
    } catch (error) {
      console.error('Error sorting results:', error);
      toast.error('Error sorting results');
    }
  };

  return {
    filteredResults,
    filterValue,
    sortValue,
    localPage,
    setLocalPage,
    handleFilter,
    handleSort,
    isLoading
  };
};
