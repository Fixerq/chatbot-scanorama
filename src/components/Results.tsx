
import React, { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import ResultsContent from './results/ResultsContent';
import ResultsContainer from './results/ResultsContainer';
import ResultsTable, { Result } from './ResultsTable';
import EmptyResults from './results/EmptyResults';
import { QueuedAnalysis } from '@/types/database';
import { Database } from '@/integrations/supabase/types';
import { Loader2 } from 'lucide-react';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

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
  // Add logging to track results prop changes
  useEffect(() => {
    console.log('Results component received new results:', results);
  }, [results]);

  useEffect(() => {
    if (!results.length) return;

    // Subscribe to worker status updates
    const workerChannel = supabase
      .channel('worker_updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'worker_instances',
          filter: `status=in.(active,processing)`
        },
        (payload) => {
          console.log('Worker status update:', payload);
        }
      )
      .subscribe();

    // Subscribe to job updates
    const jobChannel = supabase
      .channel('job_updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'analysis_job_queue',
          filter: `url=in.(${results.map(r => `'${r.url}'`).join(',')})`,
        },
        (payload: RealtimePostgresChangesPayload<QueuedAnalysis>) => {
          console.log('Job update:', payload);
          if (payload.eventType !== 'DELETE' && payload.new && onResultUpdate) {
            const result = results.find(r => r.url === payload.new?.url);
            if (result) {
              const updatedResult: Result = {
                ...result,
                status: payload.new.status,
                error: payload.new.error_message,
              };
              onResultUpdate(updatedResult);
            }
          }
        }
      )
      .subscribe();

    // Subscribe to analysis results
    const analysisChannel = supabase
      .channel('analysis_updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'analysis_results',
          filter: `url=in.(${results.map(r => `'${r.url}'`).join(',')})`,
        },
        (payload: RealtimePostgresChangesPayload<AnalysisRecord>) => {
          console.log('Analysis result update:', payload);
          if (onResultUpdate && payload.eventType !== 'DELETE' && payload.new) {
            const newAnalysis = payload.new;
            const resultToUpdate = results.find(r => r.url === newAnalysis.url);
            if (resultToUpdate) {
              const updatedResult: Result = {
                ...resultToUpdate,
                analysis_result: {
                  has_chatbot: newAnalysis.has_chatbot,
                  chatSolutions: newAnalysis.chatbot_solutions || [],
                  status: newAnalysis.status || 'completed',
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
      .subscribe();

    return () => {
      supabase.removeChannel(workerChannel);
      supabase.removeChannel(jobChannel);
      supabase.removeChannel(analysisChannel);
    };
  }, [results, onResultUpdate]);

  if (isAnalyzing) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-lg text-muted-foreground">Analyzing websites...</p>
        <p className="text-sm text-muted-foreground">This may take a few moments</p>
      </div>
    );
  }

  // Changed this condition to only check for empty results
  if (results.length === 0) {
    return <EmptyResults onNewSearch={onNewSearch} />;
  }

  return (
    <ResultsContainer
      results={results}
      onExport={onExport}
      onNewSearch={onNewSearch}
      hasMore={hasMore}
      onLoadMore={onLoadMore}
      isLoadingMore={isLoadingMore}
    >
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
          onRetry={async (url: string) => {
            try {
              const { error } = await supabase.functions.invoke('analyze-website', {
                body: { url, retry: true }
              });

              if (error) {
                toast.error(`Failed to retry analysis for ${url}`);
              } else {
                toast.success(`Analysis retried for ${url}`);
              }
            } catch (error) {
              console.error('Error retrying analysis:', error);
              toast.error('Failed to retry analysis');
            }
          }}
        />
      </ResultsContent>
    </ResultsContainer>
  );
};

export default Results;
