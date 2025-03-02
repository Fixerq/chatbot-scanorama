
import { Result } from '@/components/ResultsTable';
import { performGoogleSearch } from './searchEngine';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const enhanceSearchQuery = async (
  query: string,
  country: string,
  region: string
): Promise<string> => {
  try {
    console.log('Enhancing search query with params:', { query, country, region });
    
    const { data, error } = await supabase.functions.invoke('enhance-search', {
      body: { 
        query, 
        country, 
        region,
        industry: 'all', // Add industry context to improve results
        businessType: 'local', // Focus on local businesses
      }
    });

    if (error || !data?.enhancedQuery) {
      console.error('Error enhancing search query:', error);
      toast.error('Failed to enhance search query, using original query');
      return query;
    }

    console.log('Original query:', query);
    console.log('Enhanced query:', data.enhancedQuery);
    
    if (!data.enhancedQuery || data.enhancedQuery.length < 3) {
      console.log('Enhanced query too short, using original');
      return query;
    }

    return data.enhancedQuery;
  } catch (error) {
    console.error('Error calling enhance-search function:', error);
    toast.error('Failed to enhance search query, using original query');
    return query;
  }
};

export const executeSearch = async (
  query: string,
  country: string,
  region: string,
  apiKey: string,
  resultsLimit: number,
  currentResults: Result[]
): Promise<{ newResults: Result[]; hasMore: boolean } | null> => {
  try {
    const enhancedQuery = await enhanceSearchQuery(query, country, region);

    // Add more specific terms to the query to find businesses more likely to have chatbots
    const chatbotTerms = "website online live chat customer service support chatbot contact";
    const finalQuery = `${enhancedQuery} ${chatbotTerms}`;

    console.log('Starting search with params:', {
      originalQuery: query,
      enhancedQuery,
      finalQuery,
      country,
      region,
      limit: resultsLimit
    });

    // Pass both country and region parameters for more accurate location filtering
    const searchResult = await performGoogleSearch(
      finalQuery,
      country,
      region
    );

    if (!searchResult) {
      console.error('No search results returned');
      return { newResults: [], hasMore: false };
    }

    console.log('Search results received:', searchResult.results?.length || 0);

    // Check if we have any results
    if (!searchResult.results || searchResult.results.length === 0) {
      console.log('Search returned empty results array');
      return { newResults: [], hasMore: false };
    }

    // Filter out duplicates while keeping existing results
    const existingUrls = new Set(currentResults.map(r => r.url.toLowerCase()));
    const newResults = searchResult.results.filter(result => {
      const lowerUrl = result.url.toLowerCase();
      return !existingUrls.has(lowerUrl);
    });

    console.log(`Found ${newResults.length} new results after filtering duplicates`);

    return {
      newResults,
      hasMore: searchResult.hasMore && newResults.length > 0
    };
  } catch (error) {
    console.error('Search execution error:', error);
    toast.error('Failed to perform search. Please try again.');
    return null;
  }
};

export const loadMore = async (
  query: string,
  country: string,
  region: string,
  currentResults: Result[],
  targetResultCount: number
): Promise<{ newResults: Result[]; hasMore: boolean } | null> => {
  try {
    const startIndex = currentResults.length;
    console.log(`Loading more results with startIndex: ${startIndex}, target: ${targetResultCount}`);
    
    // Add chatbot-specific terms to improve results
    const chatbotTerms = "website online live chat customer service support chatbot contact";
    const enhancedQuery = await enhanceSearchQuery(query, country, region);
    const finalQuery = `${enhancedQuery} ${chatbotTerms}`;
    
    // Calculate the maximum number of results we need
    const maxNeededResults = Math.max(50, targetResultCount - startIndex);
    
    // First attempt
    let searchResult = await performGoogleSearch(finalQuery, country, region, startIndex);
    
    // If first attempt fails, try with different parameters
    if (!searchResult?.results || searchResult.results.length === 0) {
      console.log('No results in first attempt, trying with adjusted parameters');
      
      // Try with a different query formulation
      const alternateQuery = `${query} chatbot customer service`;
      searchResult = await performGoogleSearch(alternateQuery, country, region, Math.max(0, startIndex - 10));
      
      // If that still fails, try one more approach
      if (!searchResult?.results || searchResult.results.length === 0) {
        console.log('Second attempt failed, trying with more generic search');
        searchResult = await performGoogleSearch(query, country, region, 0);
      }
    }
    
    if (!searchResult || !searchResult.results) {
      console.log('No more results found after multiple attempts');
      return { newResults: [], hasMore: false };
    }

    // Create a Set of existing URLs (in lowercase for case-insensitive comparison)
    const existingUrls = new Set(currentResults.map(r => r.url.toLowerCase()));
    
    // Filter out duplicates using case-insensitive comparison
    const newResults = searchResult.results.filter(result => {
      const lowerCaseUrl = result.url.toLowerCase();
      return !existingUrls.has(lowerCaseUrl);
    });

    console.log(`Loaded ${searchResult.results.length} results, ${newResults.length} new after filtering duplicates`);
    
    // Only report hasMore if we actually found new results and haven't met our target count
    const reachedTargetCount = currentResults.length + newResults.length >= targetResultCount;
    const hasMore = searchResult.hasMore && (!reachedTargetCount);
    
    return {
      newResults,
      hasMore
    };
  } catch (error) {
    console.error('Load more error:', error);
    toast.error('Failed to load more results');
    return null;
  }
};
