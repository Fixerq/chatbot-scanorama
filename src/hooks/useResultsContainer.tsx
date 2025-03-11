
import { useState, useEffect, useMemo } from 'react';
import { Result } from '@/components/ResultsTable';

export const useResultsContainer = (results: Result[] = []) => {
  // Filter out results with error status
  const validResults = useMemo(() => {
    console.log('Computing validResults from', results?.length || 0, 'results');
    // First check if we have results to process
    if (!results || results.length === 0) {
      return [];
    }
    
    // Filter out error results
    return results.filter(r => {
      // Make sure the result exists and has valid data
      if (!r) return false;
      // Check if the result has an error status
      return !r.status?.toLowerCase().includes('error analyzing url');
    });
  }, [results]);
  
  const [filteredResults, setFilteredResults] = useState<Result[]>([]);
  const [filterValue, setFilterValue] = useState('all');
  const [sortValue, setSortValue] = useState('name');

  // Update filtered results when the input results change or filter changes
  useEffect(() => {
    console.log('Processing results in useResultsContainer:', validResults.length);
    let filtered = [...validResults];
    
    if (filterValue === 'chatbot') {
      filtered = filtered.filter(r => r.details?.chatSolutions?.length > 0);
    } else if (filterValue === 'no-chatbot') {
      filtered = filtered.filter(r => !r.details?.chatSolutions?.length);
    }
    
    // Apply sorting
    if (sortValue === 'name') {
      filtered.sort((a, b) => (a.details?.title || '').localeCompare(b.details?.title || ''));
    } else if (sortValue === 'url') {
      filtered.sort((a, b) => a.url.localeCompare(b.url));
    } else if (sortValue === 'status') {
      filtered.sort((a, b) => (a.status || '').localeCompare(b.status || ''));
    }
    
    console.log(`After filtering and sorting: ${filtered.length} results`);
    setFilteredResults(filtered);
  }, [validResults, filterValue, sortValue]);

  const handleFilter = (value: string) => {
    console.log('Applying filter:', value);
    setFilterValue(value);
  };

  const handleSort = (value: string) => {
    console.log('Applying sort:', value);
    setSortValue(value);
  };

  // Calculate chatbot counts
  const chatbotCount = validResults.filter(r => r.details?.chatSolutions?.length > 0).length;

  return {
    validResults: filteredResults, // Return the filtered and sorted results
    filterValue,
    sortValue,
    chatbotCount,
    handleFilter,
    handleSort
  };
};

export default useResultsContainer;
