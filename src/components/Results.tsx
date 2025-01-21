import React, { useState } from 'react';
import ResultsTable, { Result } from './ResultsTable';
import ResultsHeader from './results/ResultsHeader';
import ResultsFilters from './results/ResultsFilters';
import EmptyResults from './results/EmptyResults';

interface ResultsProps {
  results?: Result[];
  onExport: () => void;
  onNewSearch: () => void;
}

const Results = ({ results = [], onExport, onNewSearch }: ResultsProps) => {
  // Filter out results with error status and no chatbots before setting initial state
  const validResults = results.filter(r => 
    !r.status?.toLowerCase().includes('error analyzing url') && 
    r.details?.chatSolutions?.length > 0
  );
  const [filteredResults, setFilteredResults] = useState<Result[]>(validResults);
  const [filterValue, setFilterValue] = useState('all');
  const [sortValue, setSortValue] = useState('name');

  React.useEffect(() => {
    // Filter out error results and no chatbots whenever the results prop changes
    const newValidResults = results.filter(r => 
      !r.status?.toLowerCase().includes('error analyzing url') &&
      r.details?.chatSolutions?.length > 0
    );
    setFilteredResults(newValidResults);
  }, [results]);

  const handleFilter = (value: string) => {
    setFilterValue(value);
    let filtered = [...results].filter(r => 
      !r.status?.toLowerCase().includes('error analyzing url') &&
      r.details?.chatSolutions?.length > 0
    );
    
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

  if (!validResults || validResults.length === 0) {
    return <EmptyResults onNewSearch={onNewSearch} />;
  }

  const chatbotCount = validResults.length; // All results now have chatbots

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
        <ResultsTable results={filteredResults} />
      </div>
    </div>
  );
};

export default Results;