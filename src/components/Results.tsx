
import React, { useState } from 'react';
import ResultsHeader from './results/ResultsHeader';
import ResultsFilters from './results/ResultsFilters';
import ResultsContent from './results/ResultsContent';
import ResultsContainer from './results/ResultsContainer';
import ResultsTable, { Result } from './ResultsTable';
import EmptyResults from './results/EmptyResults';

interface ResultsProps {
  results: Result[];
  onExport: () => void;
  onNewSearch: () => void;
  hasMore: boolean;
  onLoadMore: (page: number) => void;
  isLoadingMore?: boolean;
  onResultUpdate?: (updatedResult: Result) => void;
}

const Results: React.FC<ResultsProps> = ({ 
  results, 
  onExport, 
  onNewSearch, 
  hasMore, 
  onLoadMore,
  isLoadingMore,
  onResultUpdate
}) => {
  const hasResults = results.length > 0;
  const [filterValue, setFilterValue] = useState('all');
  const [sortValue, setSortValue] = useState('name');
  const [localPage, setLocalPage] = useState(1);

  // Calculate the number of results with chatbots
  const chatbotCount = results.filter(result => result.analysis_result?.has_chatbot).length;

  const handleFilterChange = (value: string) => {
    setFilterValue(value);
    setLocalPage(1);
  };

  const handleSortChange = (value: string) => {
    setSortValue(value);
    setLocalPage(1);
  };

  return (
    <ResultsContainer
      results={results}
      onExport={onExport}
      onNewSearch={onNewSearch}
      hasMore={hasMore}
      onLoadMore={onLoadMore}
      isLoadingMore={isLoadingMore}
    >
      {hasResults ? (
        <>
          <ResultsHeader
            results={results}
            totalCount={results.length}
            chatbotCount={chatbotCount}
            onNewSearch={onNewSearch}
            onExport={onExport}
          />
          <ResultsFilters
            filterValue={filterValue}
            sortValue={sortValue}
            onFilterChange={handleFilterChange}
            onSortChange={handleSortChange}
          />
          <ResultsContent
            results={results}
            localPage={localPage}
            setLocalPage={setLocalPage}
            hasMore={hasMore}
            onLoadMore={onLoadMore}
            isLoadingMore={isLoadingMore}
          >
            <ResultsTable 
              results={results} 
              isLoading={isLoadingMore}
              onResultUpdate={onResultUpdate}
            />
          </ResultsContent>
        </>
      ) : (
        <EmptyResults onNewSearch={onNewSearch} />
      )}
    </ResultsContainer>
  );
};

export default Results;

