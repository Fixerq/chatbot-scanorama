import React, { useState } from 'react';
import ResultsTable, { Result } from './ResultsTable';
import ResultsHeader from './results/ResultsHeader';
import ResultsFilters from './results/ResultsFilters';
import EmptyResults from './results/EmptyResults';
import LoadMoreButton from './LoadMoreButton';

interface ResultsProps {
  results?: Result[];
  onExport: () => void;
  onNewSearch: () => void;
}

const Results = ({ results = [], onExport, onNewSearch }: ResultsProps) => {
  // Filter out only results with error status
  const validResults = results.filter(r => 
    !r.status?.toLowerCase().includes('error analyzing url')
  );
  const [filteredResults, setFilteredResults] = useState<Result[]>(validResults);
  const [filterValue, setFilterValue] = useState('all');
  const [sortValue, setSortValue] = useState('name');
  const [displayLimit, setDisplayLimit] = useState(25);

  React.useEffect(() => {
    // Filter out error results whenever the results prop changes
    const newValidResults = results.filter(r => 
      !r.status?.toLowerCase().includes('error analyzing url')
    );
    setFilteredResults(newValidResults);
  }, [results]);

  const handleFilter = (value: string) => {
    setFilterValue(value);
    let filtered = [...validResults];
    
    if (value === 'chatbot') {
      filtered = filtered.filter(r => r.details?.chatSolutions?.length > 0);
    } else if (value === 'no-chatbot') {
      filtered = filtered.filter(r => !r.details?.chatSolutions?.length);
    }
    
    setFilteredResults(filtered);
  };

  const handleSort = (value: string) => {
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

  const handleLoadMore = () => {
    setDisplayLimit(prev => prev + 25);
  };

  if (!validResults || validResults.length === 0) {
    return <EmptyResults onNewSearch={onNewSearch} />;
  }

  const chatbotCount = validResults.filter(r => r.details?.chatSolutions?.length > 0).length;
  const noChatbotCount = validResults.filter(r => !r.details?.chatSolutions?.length).length;
  const displayedResults = filteredResults.slice(0, displayLimit);
  const hasMore = displayLimit < filteredResults.length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <ResultsFilters
          filterValue={filterValue}
          sortValue={sortValue}
          onFilterChange={handleFilter}
          onSortChange={handleSort}
        />
        <ResultsHeader
          results={validResults}
          totalCount={validResults.length}
          chatbotCount={chatbotCount}
          onNewSearch={onNewSearch}
          onExport={onExport}
        />
      </div>
      <div className="rounded-[1.25rem] overflow-hidden">
        <ResultsTable results={displayedResults} />
      </div>
      {hasMore && (
        <LoadMoreButton 
          onLoadMore={handleLoadMore}
          isProcessing={false}
        />
      )}
    </div>
  );
};

export default Results;