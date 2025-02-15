
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
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

  useEffect(() => {
    if (!hasResults) return;

    // Subscribe to real-time updates for analysis results
    const channel = supabase
      .channel('analysis_updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'analysis_results',
          filter: `url=in.(${results.map(r => `'${r.url}'`).join(',')})`,
        },
        (payload) => {
          console.log('Received real-time update:', payload);
          if (onResultUpdate && payload.new) {
            const updatedUrl = payload.new.url;
            const resultToUpdate = results.find(r => r.url === updatedUrl);
            if (resultToUpdate) {
              const updatedResult = {
                ...resultToUpdate,
                analysis_result: payload.new,
                status: 'completed'
              };
              onResultUpdate(updatedResult);
              
              if (payload.new.has_chatbot) {
                toast.success(`Chatbot detected on ${updatedUrl}`);
              }
            }
          }
        }
      )
      .subscribe((status) => {
        console.log('Subscription status:', status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [results, onResultUpdate]);

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
