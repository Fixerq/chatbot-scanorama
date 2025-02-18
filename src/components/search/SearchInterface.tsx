
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { SearchResults } from "./SearchResults";

const countries = [
  { code: "US", name: "United States" },
  { code: "CA", name: "Canada" },
  { code: "GB", name: "United Kingdom" },
  { code: "AU", name: "Australia" },
];

const regions = {
  US: [
    "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
    "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
    "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
    "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
    "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY"
  ],
  CA: [
    "AB", "BC", "MB", "NB", "NL", "NS", "NT", "NU", "ON", "PE", "QC", "SK", "YT"
  ],
  GB: [
    "England", "Scotland", "Wales", "Northern Ireland"
  ],
  AU: [
    "ACT", "NSW", "NT", "QLD", "SA", "TAS", "VIC", "WA"
  ]
};

export const SearchInterface = () => {
  const { toast } = useToast();
  const [query, setQuery] = useState("");
  const [country, setCountry] = useState("");
  const [region, setRegion] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [searchId, setSearchId] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!query || !country) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
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

      setSearchId(searchHistory.id);

      // Call places API
      const { data: placesData, error: placesError } = await supabase.functions.invoke(
        "search-places",
        {
          body: {
            query,
            country,
            region: region || undefined,
          },
        }
      );

      if (placesError) throw placesError;
      console.log("Places API response:", placesData);

      // Filter and transform valid results before insertion
      if (placesData?.results?.length > 0) {
        const validResults = placesData.results
          .filter((result: any) => result.name) // Only include results with a name
          .map((result: any) => ({
            search_id: searchHistory.id,
            business_name: result.name || 'Unnamed Business', // Fallback name if somehow null
            website_url: result.website || null,
            phone_number: result.formatted_phone_number || null,
            address: result.formatted_address || null,
          }));

        console.log("Processed results to insert:", validResults);

        if (validResults.length > 0) {
          const { error: resultsError } = await supabase
            .from("search_results")
            .insert(validResults);

          if (resultsError) {
            console.error("Error inserting results:", resultsError);
            throw resultsError;
          }
          console.log("Successfully inserted results");
        } else {
          console.log("No valid results to insert");
        }
      } else {
        console.log("No results from Places API");
      }

      toast({
        title: "Search completed",
        description: "Results have been retrieved",
      });
    } catch (error) {
      console.error("Search error:", error);
      toast({
        title: "Search failed",
        description: "Failed to complete search. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <div className="md:col-span-2">
          <Input
            placeholder="Enter business category..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div>
          <Select value={country} onValueChange={setCountry}>
            <SelectTrigger>
              <SelectValue placeholder="Select country" />
            </SelectTrigger>
            <SelectContent>
              {countries.map((c) => (
                <SelectItem key={c.code} value={c.code}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Select
            value={region}
            onValueChange={setRegion}
            disabled={!country || !regions[country as keyof typeof regions]}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select region" />
            </SelectTrigger>
            <SelectContent>
              {country &&
                regions[country as keyof typeof regions]?.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex justify-end">
        <Button onClick={handleSearch} disabled={isLoading}>
          {isLoading ? "Searching..." : "Search"}
        </Button>
      </div>
      {searchId && <SearchResults searchId={searchId} />}
    </div>
  );
};

