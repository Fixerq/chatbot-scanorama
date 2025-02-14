
import { useState, useEffect } from 'react';
import { Result } from '@/components/ResultsTable';

export const useResultsState = (initialResults: Result[] = []) => {
  const [filteredResults, setFilteredResults] = useState<Result[]>(initialResults);
  const [filterValue, setFilterValue] = useState('all');
  const [sortValue, setSortValue] = useState('name');
  const [localPage, setLocalPage] = useState(1);

  useEffect(() => {
    // Update filtered results when initial results change
    let updatedResults = initialResults;

    // Only show results that have completed analysis
    updatedResults = updatedResults.filter(r => {
      const hasStatus = r.status && r.status.toLowerCase() === 'success';
      const hasAnalysisResult = r.details?.chatSolutions || r.chatbot_solutions;
      return hasStatus || hasAnalysisResult;
    });

    setFilteredResults(updatedResults);
    setLocalPage(1);
  }, [initialResults]);

  const handleFilter = (value: string) => {
    setFilterValue(value);
    let filtered = [...initialResults];
    
    // First filter out unanalyzed results
    filtered = filtered.filter(r => {
      const hasStatus = r.status && r.status.toLowerCase() === 'success';
      const hasAnalysisResult = r.details?.chatSolutions || r.chatbot_solutions;
      return hasStatus || hasAnalysisResult;
    });
    
    if (value === 'chatbot') {
      filtered = filtered.filter(r => r.has_chatbot || (r.details?.chatSolutions && r.details.chatSolutions.length > 0));
    } else if (value === 'no-chatbot') {
      filtered = filtered.filter(r => !r.has_chatbot && (!r.details?.chatSolutions || r.details.chatSolutions.length === 0));
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
          const nameA = a.details?.business_name || a.businessName || '';
          const nameB = b.details?.business_name || b.businessName || '';
          return nameA.localeCompare(nameB);
        });
        break;
      case 'url':
        sorted.sort((a, b) => {
          const urlA = a.details?.website_url || a.url;
          const urlB = b.details?.website_url || b.url;
          return urlA.localeCompare(urlB);
        });
        break;
      case 'status':
        sorted.sort((a, b) => {
          const statusA = a.status || '';
          const statusB = b.status || '';
          return statusA.localeCompare(statusB);
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
