
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Enhances a search query using AI or fallback methods
 */
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
