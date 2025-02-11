
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { SearchResult } from './types';

interface StorageParams {
  userId: string;
  query: string;
  country: string;
  region: string;
  results: SearchResult[];
}

export const storeSearchResults = async (
  supabaseAdmin: ReturnType<typeof createClient>,
  { userId, query, country, region, results }: StorageParams
) => {
  try {
    // Create search history entry
    const { data: searchHistory, error: searchHistoryError } = await supabaseAdmin
      .from('search_history')
      .insert({
        user_id: userId,
        query,
        country,
        region,
        search_batch_id: crypto.randomUUID()
      })
      .select()
      .single();

    if (searchHistoryError) {
      console.error('Error creating search history:', searchHistoryError);
      throw new Error('Failed to record search history');
    }

    // Store search results if any exist
    if (results.length > 0) {
      const searchResults = results.map(item => ({
        search_id: searchHistory.id,
        business_name: item.details.title,
        description: item.details.description,
        website_url: item.url,
        address: item.details.address,
        business_type: item.details.businessType,
        phone_number: item.details.phoneNumber
      }));

      const { error: resultsError } = await supabaseAdmin
        .from('search_results')
        .insert(searchResults);

      if (resultsError) {
        console.error('Error storing search results:', resultsError);
        // Continue execution even if storing results fails
      }
    }

    return searchHistory.search_batch_id;
  } catch (error) {
    console.error('Storage operation failed:', error);
    throw error;
  }
};
