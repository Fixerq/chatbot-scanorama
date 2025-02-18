
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { SearchForm } from "./SearchForm";
import { SearchResults } from "./SearchResults";
import { performSearch } from "./searchOperations";

export const SearchInterface = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [searchId, setSearchId] = useState<string | null>(null);

  const handleSearch = async (query: string, country: string, region: string) => {
    setIsLoading(true);
    try {
      const newSearchId = await performSearch(query, country, region);
      setSearchId(newSearchId);
      
      toast({
        title: "Search completed",
        description: "Results have been fetched successfully",
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
      <SearchForm onSearch={handleSearch} isLoading={isLoading} />
      {searchId && <SearchResults searchId={searchId} />}
    </div>
  );
};
