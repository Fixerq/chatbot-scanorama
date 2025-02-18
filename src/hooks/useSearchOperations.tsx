
import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { SearchResult, Status } from '@/utils/types/search';
import { Result } from '@/components/ResultsTable';
import { toast } from 'sonner';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

interface SearchResponse {
  results: SearchResult[];
  nextPageToken?: string;
  searchBatchId?: string;
  error?: string;
  details?: string;
}

// Define the type for the analysis result from the database
interface SimplifiedAnalysisResult {
  url: string;
  status: string;
  error?: string;
  has_chatbot: boolean;
  chatbot_solutions: string[];
  updated_at: string;
}

const transformSearchResult = (searchResult: SearchResult): Result => {
  console.log('Transforming search result:', searchResult);

  // Ensure we have default values for all required fields
  const transformedResult: Result = {
    url: searchResult.url,
    title: searchResult.title || searchResult.metadata?.business_name || 'Untitled',
    description: searchResult.description || '',
    business_name: searchResult.metadata?.business_name || '',
    website_url: searchResult.url,
    address: searchResult.metadata?.formatted_address || '',
    placeId: searchResult.metadata?.place_id || '',
    status: searchResult.status || 'pending',
    error: searchResult.error,
    details: {
      search_batch_id: '',
      business_name: searchResult.metadata?.business_name || '',
      title: searchResult.title || '',
      description: searchResult.description || '',
      address: searchResult.metadata?.formatted_address || '',
      website_url: searchResult.url,
    }
  };

  // Initiate analysis for the URL
  initiateAnalysis(transformedResult.url)
    .then(analysis => {
      if (analysis) {
        transformedResult.analysis_result = {
          has_chatbot: analysis.has_chatbot,
          chatSolutions: analysis.chatbot_solutions || [],
          status: analysis.status as Status,
          lastChecked: analysis.updated_at
        };
      }
    })
    .catch(error => {
      console.error('Error initiating analysis:', error);
      transformedResult.error = error.message;
    });

  console.log('Transformed result:', transformedResult);
  return transformedResult;
};

const initiateAnalysis = async (url: string) => {
  try {
    // First check if we have a pending analysis
    const { data: existingAnalysis } = await supabase
      .from('simplified_analysis_results')
      .select('*')
      .eq('url', url)
      .order('created_at', { ascending: false })
      .maybeSingle();

    if (existingAnalysis?.status === 'processing') {
      console.log('Analysis already in progress for this URL');
      return existingAnalysis;
    }

    // Create or update the analysis record
    const { data: analysis, error: initError } = await supabase
      .from('simplified_analysis_results')
      .upsert({
        url: url,
        status: 'pending',
        has_chatbot: false,
        chatbot_solutions: [],
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (initError) {
      console.error('Error initializing analysis:', initError);
      throw initError;
    }

    console.log('Created analysis record:', analysis);

    // Call the analyze-website function
    const { error } = await supabase.functions.invoke('analyze-website', {
      body: {
        urls: [url],
        isBatch: false,
        retry: true,
        requestId: analysis.id
      }
    });

    if (error) {
      console.error('Error analyzing website:', error);
      throw error;
    }

    console.log('Analysis initiated successfully');
    return analysis;
  } catch (error) {
    console.error('Failed to analyze website:', error);
    toast.error('Analysis failed', {
      description: error instanceof Error ? error.message : 'Unknown error occurred'
    });
    throw error;
  }
};

export const useSearchOperations = (setResults: React.Dispatch<React.SetStateAction<Result[]>>) => {
  const [isSearching, setIsSearching] = useState(false);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [analysisSubscription, setAnalysisSubscription] = useState<ReturnType<typeof supabase.channel> | null>(null);

  // Subscribe to analysis updates
  useEffect(() => {
    const channel = supabase
      .channel('analysis-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'simplified_analysis_results'
        },
        (payload: RealtimePostgresChangesPayload<SimplifiedAnalysisResult>) => {
          console.log('Received analysis update:', payload);
          if (payload.new) {
            setResults(prevResults => 
              prevResults.map(result => {
                if (result.url === payload.new.url) {
                  return {
                    ...result,
                    status: payload.new.status,
                    error: payload.new.error,
                    analysis_result: {
                      has_chatbot: payload.new.has_chatbot,
                      chatSolutions: payload.new.chatbot_solutions || [],
                      status: payload.new.status as Status,
                      lastChecked: payload.new.updated_at
                    }
                  };
                }
                return result;
              })
            );
          }
        }
      )
      .subscribe();

    setAnalysisSubscription(channel);

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [setResults]);

  const handleSearch = useCallback(async (
    query: string,
    country: string,
    region: string,
    apiKey: string,
    limit: number
  ) => {
    console.log('Starting search with params:', { query, country, region, limit });
    setIsSearching(true);
    try {
      const { data, error } = await supabase.functions.invoke<SearchResponse>('search-places', {
        body: { 
          query: query.trim(), 
          country: country.trim(), 
          region: region.trim(), 
          limit 
        }
      });

      console.log('Search response:', data);

      if (error) {
        console.error('Supabase function error:', error);
        toast.error('Search failed: ' + error.message);
        throw error;
      }

      if (data?.error) {
        console.error('Search error:', data.error, data.details);
        toast.error(data.error);
        throw new Error(data.error);
      }

      if (!data?.results) {
        console.error('No results returned from search');
        toast.error('No results found');
        setResults([]);
        return;
      }

      console.log('Search successful:', data.results.length, 'results found');
      console.log('Raw results data:', data.results);
      
      // Transform SearchResult[] to Result[]
      const transformedResults = data.results.map(transformSearchResult);
      console.log('Transformed results:', transformedResults);
      
      setResults(transformedResults);
      setNextPageToken(data.nextPageToken || null);
      
      if (data.results.length === 0) {
        toast.info('No results found for your search');
      }
    } catch (error) {
      console.error('Search error:', error);
      toast.error('An error occurred during search');
      setResults([]);
      throw error;
    } finally {
      setIsSearching(false);
    }
  }, [setResults]);

  const handleLoadMore = useCallback(async (
    query: string,
    country: string,
    region: string,
    page: number,
    limit: number
  ) => {
    if (!nextPageToken) {
      console.log('No next page token available');
      return;
    }

    console.log('Loading more results with params:', { query, country, region, page, limit });
    setIsSearching(true);
    try {
      const { data, error } = await supabase.functions.invoke<SearchResponse>('search-places', {
        body: { 
          query: query.trim(), 
          country: country.trim(), 
          region: region.trim(), 
          pageToken: nextPageToken,
          page,
          limit
        }
      });

      console.log('Load more response:', data);

      if (error) {
        console.error('Load more error:', error);
        toast.error('Failed to load more results: ' + error.message);
        throw error;
      }

      if (data?.error) {
        console.error('Load more error:', data.error, data.details);
        toast.error(data.error);
        throw new Error(data.error);
      }

      if (data?.results) {
        console.log('Load more successful:', data.results.length, 'additional results');
        const transformedResults = data.results.map(transformSearchResult);
        console.log('Transformed additional results:', transformedResults);
        
        setResults(prevResults => [...prevResults, ...transformedResults]);
        setNextPageToken(data.nextPageToken || null);
      }
    } catch (error) {
      console.error('Load more error:', error);
      toast.error('Failed to load more results');
      throw error;
    } finally {
      setIsSearching(false);
    }
  }, [nextPageToken, setResults]);

  return {
    isSearching,
    handleSearch,
    handleLoadMore,
    nextPageToken
  };
};
