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
    const chatbotTerms = "website live chat customer service support chatbot";
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
    const newResults = searchResult.results.filter(result => !existingUrls.has(result.url.toLowerCase()));

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
  newLimit: number
): Promise<{ newResults: Result[]; hasMore: boolean } | null> => {
  const startIndex = currentResults.length;
  
  try {
    console.log('Loading more results with startIndex:', startIndex, 'and region:', region);
    
    // Add chatbot-specific terms to improve results
    const chatbotTerms = "website live chat customer service support chatbot";
    const enhancedQuery = `${query} ${chatbotTerms}`;
    
    // Pass the region parameter to the search function for location-based filtering
    const searchResult = await performGoogleSearch(enhancedQuery, country, region, startIndex);
    
    if (!searchResult || !searchResult.results) {
      console.log('No more results found');
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
    
    // Only report hasMore if we actually found new results
    const hasMore = searchResult.hasMore && newResults.length > 0;
    
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
