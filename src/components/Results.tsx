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
    handleFilter(filterValue);
  }, [results, filterValue]);

  const handleFilter = (value: string) => {
    setFilterValue(value);
    let filtered = [...results];

    switch (value) {
      case 'chatbot':
        filtered = results.filter(r => r.details?.chatSolutions && r.details.chatSolutions.length > 0);
        break;
      case 'no-chatbot':
        filtered = results.filter(r => !r.details?.chatSolutions || r.details.chatSolutions.length === 0);
        break;
      default:
        filtered = results;
    }

    handleSort(sortValue, filtered);
  };

  const handleSort = (value: string, resultsToSort = filteredResults) => {
    setSortValue(value);
    let sorted = [...resultsToSort];

    switch (value) {
      case 'name':
        sorted.sort((a, b) => {
          const nameA = a.details?.title || '';
          const nameB = b.details?.title || '';
          return nameA.localeCompare(nameB);
        });
        break;
      case 'url':
        sorted.sort((a, b) => (a.url || '').localeCompare(b.url || ''));
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
          onSortChange={(value) => handleSort(value)}
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