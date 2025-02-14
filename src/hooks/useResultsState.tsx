
import { useState, useEffect } from 'react';
import { Result } from '@/components/ResultsTable';

export const useResultsState = (initialResults: Result[] = []) => {
  const [filteredResults, setFilteredResults] = useState<Result[]>(initialResults);
  const [filterValue, setFilterValue] = useState('all');
  const [sortValue, setSortValue] = useState('name');
  const [localPage, setLocalPage] = useState(1);

  useEffect(() => {
    // Update filtered results when initial results change
    let updatedResults = [...initialResults].map(result => ({
      ...result,
      // Ensure the URL is consistently available
      url: result.details?.website_url || result.url || '',
      // Map business name from either source
      businessName: result.details?.business_name || result.businessName || '',
      // Ensure chatbot status is consistently available
      has_chatbot: result.has_chatbot || (result.details?.chatSolutions?.length > 0) || false,
      // Map chatbot solutions consistently
      chatbot_solutions: result.chatbot_solutions || result.details?.chatSolutions || []
    }));

    // Less strict filtering to show more results
    updatedResults = updatedResults.filter(r => {
      const hasValidStatus = r.status !== undefined;
      const hasDetails = Boolean(r.details) || Boolean(r.chatbot_solutions);
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
      businessName: result.details?.business_name || result.businessName || '',
      has_chatbot: result.has_chatbot || (result.details?.chatSolutions?.length > 0) || false,
      chatbot_solutions: result.chatbot_solutions || result.details?.chatSolutions || []
    }));
    
    // Less strict filtering for valid results
    filtered = filtered.filter(r => {
      const hasValidStatus = r.status !== undefined;
      const hasDetails = Boolean(r.details) || Boolean(r.chatbot_solutions);
      return hasValidStatus || hasDetails;
    });
    
    if (value === 'chatbot') {
      filtered = filtered.filter(r => {
        const hasChatbotFlag = r.has_chatbot || r.details?.chatSolutions?.length > 0;
        const hasSolutions = r.chatbot_solutions?.length > 0 || r.details?.chatSolutions?.length > 0;
        return hasChatbotFlag || hasSolutions;
      });
    } else if (value === 'no-chatbot') {
      filtered = filtered.filter(r => {
        const hasChatbotFlag = r.has_chatbot || r.details?.chatSolutions?.length > 0;
        const hasSolutions = r.chatbot_solutions?.length > 0 || r.details?.chatSolutions?.length > 0;
        return !hasChatbotFlag && !hasSolutions;
      });
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
          const urlA = a.details?.website_url || a.url || '';
          const urlB = b.details?.website_url || b.url || '';
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
