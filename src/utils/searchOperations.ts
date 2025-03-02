
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
    
    // For quick testing, if the API call fails, return a reasonable enhanced query
    // This serves as a fallback to prevent search failures
    const fallbackEnhancedQuery = `${query} in ${region || ''} ${country}`.trim();
    
    // If query is too short, just return the fallback enhanced query
    if (query.length < 3) {
      console.log('Query too short, using fallback enhanced query');
      return fallbackEnhancedQuery;
    }
    
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
      // Don't show a toast here to avoid too many notifications
      console.log('Using fallback enhanced query:', fallbackEnhancedQuery);
      return fallbackEnhancedQuery;
    }

    console.log('Original query:', query);
    console.log('Enhanced query:', data.enhancedQuery);
    
    if (!data.enhancedQuery || data.enhancedQuery.length < 3) {
      console.log('Enhanced query too short, using fallback');
      return fallbackEnhancedQuery;
    }

    return data.enhancedQuery;
  } catch (error) {
    console.error('Error calling enhance-search function:', error);
    // Create a reasonable fallback query
    const fallbackQuery = `${query} in ${region || ''} ${country}`.trim();
    console.log('Using fallback query due to error:', fallbackQuery);
    return fallbackQuery;
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
    // Add some validation for search parameters
    if (!query || query.trim().length < 2) {
      console.error('Search query too short');
      toast.error('Search query too short. Please provide a more specific search term.');
      return { newResults: [], hasMore: false };
    }
    
    if (!country) {
      console.error('Country not specified');
      toast.error('Please select a country for your search.');
      return { newResults: [], hasMore: false };
    }

    const enhancedQuery = await enhanceSearchQuery(query, country, region);

    // Add more specific terms to the query to find businesses more likely to have chatbots
    // but don't overdo it to ensure we get good location-specific results
    const chatbotTerms = "website customer service";
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
      
      // Try a more generic search as fallback
      console.log('Attempting fallback search with just the original query...');
      
      // Try a series of increasingly simpler searches
      const fallbackQueries = [
        query, // Original query
        `${query} in ${region || ''} ${country}`.trim(), // Structured query with location
        `${query} services in ${country}`, // Add services
        `${query} business in ${country}`, // Try with business term
        region ? `${query} in ${region}` : null, // Just region if available
        query.split(' ')[0] + ` in ${country}` // Just first word with country
      ].filter(Boolean); // Remove any null entries
      
      for (const fallbackQuery of fallbackQueries) {
        console.log(`Trying fallback search with: "${fallbackQuery}"`);
        
        // Show a toast to inform the user about the retry
        if (fallbackQuery === fallbackQueries[0]) {
          toast.info('No results found with initial search. Trying alternative search terms...');
        }
        
        const fallbackResult = await performGoogleSearch(fallbackQuery, country, region);
        
        if (fallbackResult?.results && fallbackResult.results.length > 0) {
          console.log(`Fallback search found ${fallbackResult.results.length} results`);
          
          // Filter out duplicates while keeping existing results
          const existingUrls = new Set(currentResults.map(r => r.url.toLowerCase()));
          const newResults = fallbackResult.results.filter(result => {
            const lowerUrl = result.url.toLowerCase();
            return !existingUrls.has(lowerUrl);
          });
          
          console.log(`Found ${newResults.length} new results after filtering duplicates`);
          
          if (newResults.length > 0) {
            toast.success(`Found ${newResults.length} results with modified search criteria`);
            return {
              newResults,
              hasMore: fallbackResult.hasMore && newResults.length > 0
            };
          }
        }
      }
      
      // If all fallbacks failed, return empty results
      toast.error('No results found. Please try different search terms or locations.');
      return { newResults: [], hasMore: false };
    }

    // Process "No website" placeholders
    const processedResults = searchResult.results.map(result => {
      if (result.url === 'https://example.com/no-website') {
        // For business listings without websites, create a modified entry
        // that still shows up but is clearly marked
        return {
          ...result,
          details: {
            ...result.details,
            title: `${result.details?.title || ''} (No website)`,
            description: `${result.details?.description || ''} - This business was found in search but has no website.`,
          }
        };
      }
      return result;
    });

    // Filter out duplicates while keeping existing results
    const existingUrls = new Set(currentResults.map(r => r.url.toLowerCase()));
    const newResults = processedResults.filter(result => {
      const lowerUrl = result.url.toLowerCase();
      return !existingUrls.has(lowerUrl) && lowerUrl !== 'https://example.com/no-website';
    });

    console.log(`Found ${newResults.length} new results after filtering duplicates`);

    if (newResults.length === 0) {
      toast.info('No new results found. Try different search terms or locations.');
    } else {
      toast.success(`Found ${newResults.length} new results to analyze`);
    }

    return {
      newResults,
      hasMore: searchResult.hasMore && newResults.length > 0
    };
  } catch (error) {
    console.error('Search execution error:', error);
    toast.error('Failed to perform search. Please try again with different terms.');
    return { newResults: [], hasMore: false };
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
    
    // Add chatbot-specific terms to improve results, but keep it lightweight
    const chatbotTerms = "website customer service support contact";
    const enhancedQuery = await enhanceSearchQuery(query, country, region);
    const finalQuery = `${enhancedQuery} ${chatbotTerms}`;
    
    // Calculate the maximum number of results we need
    const maxNeededResults = Math.max(50, targetResultCount - startIndex);
    
    // First attempt with primary search
    let searchResult = await performGoogleSearch(finalQuery, country, region, startIndex);
    
    // If first attempt returns no results, try different approaches
    if (!searchResult?.results || searchResult.results.length === 0) {
      console.log('No results in first attempt, trying with adjusted parameters');
      
      // Try with a slightly different query formulation (more direct geography)
      const alternateQuery = `${query} in ${region || ''} ${country}`;
      searchResult = await performGoogleSearch(alternateQuery, country, region, Math.max(0, startIndex - 10));
      
      // If that still fails, try one more approach with just the category
      if (!searchResult?.results || searchResult.results.length === 0) {
        console.log('Second attempt failed, trying with more generic search');
        searchResult = await performGoogleSearch(query, country, '', 0);
      }
    }
    
    if (!searchResult || !searchResult.results) {
      console.log('No more results found after multiple attempts');
      return { newResults: [], hasMore: false };
    }

    // Process "No website" placeholders
    const processedResults = searchResult.results.map(result => {
      if (result.url === 'https://example.com/no-website') {
        return {
          ...result,
          details: {
            ...result.details,
            title: `${result.details?.title || ''} (No website)`,
            description: `${result.details?.description || ''} - This business was found in search but has no website.`,
          }
        };
      }
      return result;
    });

    // Create a Set of existing URLs (in lowercase for case-insensitive comparison)
    const existingUrls = new Set(currentResults.map(r => r.url.toLowerCase()));
    
    // Filter out duplicates using case-insensitive comparison
    const newResults = processedResults.filter(result => {
      const lowerCaseUrl = result.url.toLowerCase();
      return !existingUrls.has(lowerCaseUrl) && lowerCaseUrl !== 'https://example.com/no-website';
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
