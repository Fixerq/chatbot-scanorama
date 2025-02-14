
import { useState, useEffect } from 'react';
import { Result } from '@/components/ResultsTable';

export const useResultsState = (initialResults: Result[] = []) => {
  const [filteredResults, setFilteredResults] = useState<Result[]>(initialResults.filter(r => 
    !r.status?.toLowerCase().includes('error analyzing url')
  ));
  const [filterValue, setFilterValue] = useState('all');
  const [sortValue, setSortValue] = useState('name');
  const [localPage, setLocalPage] = useState(1);

  useEffect(() => {
    const newValidResults = initialResults.filter(r => 
      !r.status?.toLowerCase().includes('error analyzing url')
    );
    setFilteredResults(newValidResults);
    setLocalPage(1);
  }, [initialResults]);

  const handleFilter = (value: string) => {
    setFilterValue(value);
    let filtered = [...filteredResults];
    
    if (value === 'chatbot') {
      filtered = filtered.filter(r => r.details?.chatSolutions?.length > 0);
    } else if (value === 'no-chatbot') {
      filtered = filtered.filter(r => !r.details?.chatSolutions?.length);
    }
    
    setFilteredResults(filtered);
    setLocalPage(1);
  };

  const handleSort = (value: string) => {
    setSortValue(value);
    let sorted = [...filteredResults];
    
    switch (value) {
      case 'name':
        sorted.sort((a, b) => {
          const nameA = a.details?.business_name || '';
          const nameB = b.details?.business_name || '';
          return nameA.localeCompare(nameB);
        });
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

  return {
    filteredResults,
    filterValue,
    sortValue,
    localPage,
    setLocalPage,
    handleFilter,
    handleSort
  };
};
