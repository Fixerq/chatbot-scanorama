
import { useState, useEffect } from 'react';
import { Result } from '@/components/ResultsTable';

export const useResultsState = (initialResults: Result[] = []) => {
  const [filteredResults, setFilteredResults] = useState<Result[]>(initialResults);
  const [filterValue, setFilterValue] = useState('all');
  const [sortValue, setSortValue] = useState('name');
  const [localPage, setLocalPage] = useState(1);

  useEffect(() => {
    let updatedResults = [...initialResults].map(result => ({
      ...result,
      url: result.details?.website_url || result.url || '',
      business_name: result.details?.business_name || result.business_name || '',
      status: result.details?.error ? `Error: ${result.details.error}` : result.status
    }));

    updatedResults = updatedResults.filter(r => {
      const hasValidStatus = r.status !== undefined;
      const hasDetails = Boolean(r.details);
      return hasValidStatus || hasDetails;
    });

    setFilteredResults(updatedResults);
    setLocalPage(1);
  }, [initialResults]);

  const handleFilter = (value: string) => {
    setFilterValue(value);
    let filtered = [...initialResults].map(result => ({
      ...result,
      url: result.details?.website_url || result.url || '',
      business_name: result.details?.business_name || result.business_name || '',
      status: result.details?.error ? `Error: ${result.details.error}` : result.status
    }));
    
    filtered = filtered.filter(r => {
      const hasValidStatus = r.status !== undefined;
      const hasDetails = Boolean(r.details);
      return hasValidStatus || hasDetails;
    });
    
    setFilteredResults(filtered);
    setLocalPage(1);
  };

  const handleSort = (value: string) => {
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
