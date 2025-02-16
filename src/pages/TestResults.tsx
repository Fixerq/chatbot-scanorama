
import React, { useState } from 'react';
import { Result } from '@/components/ResultsTable';
import { toast } from 'sonner';
import { performGoogleSearch } from '@/utils/searchEngine';
import ResultsTable from '@/components/ResultsTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useUrlProcessor } from '@/hooks/useUrlProcessor';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

interface AnalysisResultPayload {
  url: string;
  has_chatbot: boolean;
  chatbot_solutions: string[];
  status: string;
  details: Record<string, any>;
}

const TestResults = () => {
  const [results, setResults] = useState<Result[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [query, setQuery] = useState('');
  const [country, setCountry] = useState('US');
  const [region, setRegion] = useState('CA');
  const { processing, processSearchResults } = useUrlProcessor();

  const handleSearch = async () => {
    try {
      setIsLoading(true);
      const searchResult = await performGoogleSearch(query, country, region);

      if (!searchResult) {
        toast.error('No results found');
        return;
      }

      // Transform SearchResult to Result
      const transformedResults: Result[] = searchResult.results.map(result => ({
        url: result.url,
        title: result.title || '',
        description: result.description || '',
        details: {
          search_batch_id: searchResult.searchBatchId,
          title: result.title || '',
          description: result.description || '',
          business_name: result.details?.business_name || '',
          website_url: result.url,
          address: result.details?.address || '',
        },
        status: 'analyzing'
      }));

      setResults(transformedResults);
      toast.success(`Found ${transformedResults.length} results`);

      // Process URLs for chatbot detection with new callbacks
      await processSearchResults(
        transformedResults,
        () => setIsAnalyzing(true),
        () => setIsAnalyzing(false)
      );
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Search failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResultUpdate = (updatedResult: Result) => {
    setResults(prevResults => 
      prevResults.map(result => 
        result.url === updatedResult.url ? updatedResult : result
      )
    );
  };

  // Subscribe to real-time updates
  React.useEffect(() => {
    const channel = supabase
      .channel('analysis-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'analysis_results'
        },
        (payload: RealtimePostgresChangesPayload<AnalysisResultPayload>) => {
          console.log('Received analysis update:', payload);
          
          // Type guard to ensure payload.new has the expected properties
          if (!payload.new || typeof payload.new !== 'object') {
            console.error('Invalid payload received:', payload);
            return;
          }

          const newData = payload.new as AnalysisResultPayload;
          
          setResults(prevResults => 
            prevResults.map(result => {
              if (result.url === newData.url) {
                return {
                  ...result,
                  status: newData.status || result.status,
                  analysis_result: {
                    has_chatbot: newData.has_chatbot,
                    chatSolutions: newData.chatbot_solutions || [],
                    status: newData.status || 'completed',
                    details: newData.details || {},
                    lastChecked: new Date().toISOString()
                  }
                };
              }
              return result;
            })
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="container py-8 space-y-6">
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Test Results Page</h1>
        
        <div className="flex gap-4">
          <Input
            placeholder="Search query"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="max-w-xs"
          />
          <Button 
            onClick={handleSearch}
            disabled={isLoading || processing}
          >
            Search
          </Button>
        </div>
      </div>

      {results.length > 0 && (
        <ResultsTable 
          results={results}
          isLoading={isLoading || processing || isAnalyzing}
          onResultUpdate={handleResultUpdate}
        />
      )}
    </div>
  );
};

export default TestResults;
