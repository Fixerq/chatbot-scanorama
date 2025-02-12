
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { SearchResult } from './types.ts';

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
      .maybeSingle();

    if (searchHistoryError) {
      console.error('Error creating search history:', searchHistoryError);
      throw new Error('Failed to record search history');
    }

    if (!searchHistory) {
      console.error('No search history created');
      throw new Error('Failed to create search history');
    }

    // Store search results and cache place details if any exist
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
      }

      // Cache place details for future use
      const cachePlaces = results.map(item => ({
        place_id: item.details.placeId,
        place_data: {
          title: item.details.title,
          description: item.details.description,
          address: item.details.address,
          businessType: item.details.businessType,
          phoneNumber: item.details.phoneNumber,
          url: item.url
        },
        search_batch_id: searchHistory.search_batch_id,
        user_id: userId
      }));

      const { error: cacheError } = await supabaseAdmin
        .from('cached_places')
        .upsert(cachePlaces, {
          onConflict: 'place_id',
          ignoreDuplicates: false
        });

      if (cacheError) {
        console.error('Error caching place details:', cacheError);
      }
    }

    return searchHistory.search_batch_id;
  } catch (error) {
    console.error('Storage operation failed:', error);
    throw error;
  }
};
