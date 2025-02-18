
import { supabase } from "@/integrations/supabase/client";

export async function performSearch(query: string, country: string, region: string) {
  console.log("Starting search with params:", { query, country, region });
  
  // Create search batch first
  const { data: searchBatch, error: batchError } = await supabase
    .from("search_batches")
    .insert({
      query,
      country,
      region: region || null,
    })
    .select()
    .single();

  if (batchError) throw batchError;
  console.log("Created search batch:", searchBatch);

  // Create search history record
  const { data: searchHistory, error: searchError } = await supabase
    .from("search_history")
    .insert({
      query,
      country,
      region: region || '',
      search_batch_id: searchBatch.id
    })
    .select()
    .single();

  if (searchError) throw searchError;
  console.log("Created search history:", searchHistory);

  // Call places API
  const { data: placesData, error: placesError } = await supabase.functions.invoke(
    "search-places",
    {
      body: {
        query,
        country,
        region: region || undefined,
        searchId: searchHistory.id,
      },
    }
  );

  if (placesError) {
    console.error("Places API error:", placesError);
    throw placesError;
  }
  console.log("Places API response:", placesData);

  if (!placesData?.results) {
    console.error("No results array in Places API response");
    throw new Error("Invalid response from Places API");
  }

  // Process and insert results
  const validResults = placesData.results.map((result: any) => ({
    search_id: searchHistory.id,
    business_name: result.business_name || result.name || result.title,
    website_url: result.website_url || result.website || null,
    phone_number: result.phone_number || result.formatted_phone_number || null,
    address: result.address || result.formatted_address || null,
  }));

  console.log("Processed results to insert:", validResults);

  if (validResults.length > 0) {
    const { data: insertedData, error: resultsError } = await supabase
      .from("search_results")
      .insert(validResults)
      .select();

    if (resultsError) {
      console.error("Error inserting results:", resultsError);
      throw resultsError;
    }
    console.log("Successfully inserted results:", insertedData);
  }

  return searchHistory.id;
}
