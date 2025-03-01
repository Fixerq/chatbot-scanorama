
import { useState, useEffect, useMemo } from 'react';
import { Result } from '@/components/ResultsTable';

export const useResultsContainer = (results: Result[] = []) => {
  // Filter out only results with error status
  const validResults = useMemo(() => {
    return results?.filter(r => 
      r && !r.status?.toLowerCase().includes('error analyzing url')
    ) || [];
  }, [results]);
  
  const [filteredResults, setFilteredResults] = useState<Result[]>([]);
  const [filterValue, setFilterValue] = useState('all');
  const [sortValue, setSortValue] = useState('name');
  const [currentPage, setCurrentPage] = useState(1);
  const resultsPerPage = 25;

  // Update filtered results when the input results change or filter changes
  useEffect(() => {
    console.log('Processing results in useResultsContainer:', validResults.length);
    let filtered = [...validResults];
    
    if (filterValue === 'chatbot') {
      filtered = filtered.filter(r => r.details?.chatSolutions?.length > 0);
    } else if (filterValue === 'no-chatbot') {
      filtered = filtered.filter(r => !r.details?.chatSolutions?.length);
    }
    
    setFilteredResults(filtered);
    
    // Only reset to first page when results change, not on every render
    if (results.length !== validResults.length) {
      setCurrentPage(1);
    }
  }, [validResults, filterValue]);

  const handleFilter = (value: string) => {
    console.log('Applying filter:', value);
    setFilterValue(value);
    setCurrentPage(1); // Reset to first page when filter changes
  };

  const handleSort = (value: string) => {
    console.log('Applying sort:', value);
    setSortValue(value);
    let sorted = [...filteredResults];
    
    switch (value) {
      case 'name':
        sorted.sort((a, b) => (a.details?.title || '').localeCompare(b.details?.title || ''));
        break;
      case 'url':
        sorted.sort((a, b) => a.url.localeCompare(b.url));
        break;
      case 'status':
        sorted.sort((a, b) => (a.status || '').localeCompare(b.status || ''));
        break;
    }
    
    setFilteredResults(sorted);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Calculate pagination
  const totalPages = Math.ceil(filteredResults.length / resultsPerPage);
  const startIndex = (currentPage - 1) * resultsPerPage;
  const endIndex = Math.min(startIndex + resultsPerPage, filteredResults.length);
  const displayedResults = filteredResults.slice(startIndex, endIndex);

  // Calculate chatbot counts
  const chatbotCount = validResults.filter(r => r.details?.chatSolutions?.length > 0).length;

  return {
    validResults,
    filteredResults,
    displayedResults,
    filterValue,
    sortValue,
    currentPage,
    totalPages,
    chatbotCount,
    handleFilter,
    handleSort,
    handlePageChange
  };
};

export default useResultsContainer;
