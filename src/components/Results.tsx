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

  React.useEffect(() => {
    setFilteredResults(results);
  }, [results]);

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