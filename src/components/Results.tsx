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
  const [filteredResults, setFilteredResults] = useState<Result[]>(results);
  const [filterValue, setFilterValue] = useState('all');
  const [sortValue, setSortValue] = useState('name');

  React.useEffect(() => {
    setFilteredResults(results);
  }, [results]);

  const handleFilter = (value: string) => {
    setFilterValue(value);
    let filtered = [...results];
    
    if (value === 'chatbot') {
      filtered = results.filter(r => r.details?.chatSolutions?.length > 0);
    } else if (value === 'no-chatbot') {
      filtered = results.filter(r => !r.details?.chatSolutions?.length);
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

  if (!results || results.length === 0) {
    return <EmptyResults onNewSearch={onNewSearch} />;
  }

  const chatbotCount = results.filter(r => r.details?.chatSolutions?.length > 0).length;

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
          results={results}
          totalCount={results.length}
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