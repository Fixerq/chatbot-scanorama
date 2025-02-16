
import React, { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import ResultsContent from './results/ResultsContent';
import ResultsContainer from './results/ResultsContainer';
import ResultsTable, { Result } from './ResultsTable';
import EmptyResults from './results/EmptyResults';
import { Database } from '@/integrations/supabase/types';

type AnalysisRecord = Database['public']['Tables']['analysis_results']['Row'];

interface ResultsProps {
  results: Result[];
  onExport: () => void;
  onNewSearch: () => void;
  hasMore: boolean;
  onLoadMore: (page: number) => void;
  isLoadingMore?: boolean;
  isAnalyzing?: boolean;
  onResultUpdate?: (updatedResult: Result) => void;
}

const Results: React.FC<ResultsProps> = ({ 
  results, 
  onExport, 
  onNewSearch, 
  hasMore, 
  onLoadMore,
  isLoadingMore,
  isAnalyzing,
  onResultUpdate
}) => {
  const hasResults = results.length > 0;

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
            const newAnalysis = payload.new as AnalysisRecord;
            const resultToUpdate = results.find(r => r.url === newAnalysis.url);
            if (resultToUpdate) {
              const updatedResult: Result = {
                ...resultToUpdate,
                analysis_result: {
                  has_chatbot: newAnalysis.has_chatbot,
                  chatSolutions: newAnalysis.chatbot_solutions || [],
                  status: newAnalysis.status,
                  lastChecked: newAnalysis.last_checked,
                  error: undefined
                },
                status: 'completed'
              };
              onResultUpdate(updatedResult);
              
              if (newAnalysis.has_chatbot) {
                toast.success(`Chatbot detected on ${newAnalysis.url}`);
              }
            }
          }
        }
      )
      .subscribe()   

    return () => {
      supabase.removeChannel(channel);
    };
  }, [results, onResultUpdate, hasResults]);

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
        <ResultsContent
          results={results}
          hasMore={hasMore}
          onLoadMore={onLoadMore}
          isLoadingMore={isLoadingMore}
          isAnalyzing={isAnalyzing}
        >
          <ResultsTable 
            results={results} 
            isLoading={isLoadingMore}
            onResultUpdate={onResultUpdate}
          />
        </ResultsContent>
      ) : (
        <EmptyResults onNewSearch={onNewSearch} />
      )}
    </ResultsContainer>
  );
};

export default Results;
