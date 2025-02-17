
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
      let updatedResults = [...initialResults].map(result => ({
        ...result,
        url: result.details?.website_url || result.url || '',
        business_name: result.details?.business_name || result.business_name || '',
        status: result.details?.error ? `Error: ${result.details.error}` : result.status || 'pending',
        error: result.details?.error || result.error
      }));

      console.log('Processed results:', updatedResults);
      setFilteredResults(updatedResults);
      setLocalPage(1);
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
      let filtered = [...initialResults].map(result => ({
        ...result,
        url: result.details?.website_url || result.url || '',
        business_name: result.details?.business_name || result.business_name || '',
        status: result.details?.error ? `Error: ${result.details.error}` : result.status || 'pending',
        error: result.details?.error || result.error
      }));
      
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
      }
      
      console.log('Sorted results:', sorted);
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
