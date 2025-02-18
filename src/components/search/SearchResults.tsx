
import { useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";

interface SearchResult {
  id: string;
  business_name: string;
  website_url: string | null;
  phone_number: string | null;
  address: string | null;
  has_chatbot?: boolean | null;
  chatbot_solutions?: string[] | null;
  analysis_status?: string;
}

interface SearchResultsProps {
  searchId: string;
}

export const SearchResults = ({ searchId }: SearchResultsProps) => {
  const { toast } = useToast();

  const { data: results, isLoading } = useQuery({
    queryKey: ["searchResults", searchId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("search_results")
        .select("*")
        .eq("search_id", searchId);

      if (error) throw error;
      return data as SearchResult[];
    },
  });

  const handleAnalyze = async (url: string, resultId: string) => {
    if (!url) return;

    try {
      await supabase.functions.invoke("analyze-website", {
        body: { url, resultId },
      });

      toast({
        title: "Analysis started",
        description: "The website is being analyzed for chatbot detection",
      });
    } catch (error) {
      console.error("Analysis error:", error);
      toast({
        title: "Analysis failed",
        description: "Failed to start analysis. Please try again.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    const channel = supabase
      .channel("search_results_changes")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "search_results",
          filter: `search_id=eq.${searchId}`,
        },
        (payload) => {
          console.log("Results updated:", payload);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [searchId]);

  if (isLoading) {
    return <div>Loading results...</div>;
  }

  return (
    <div className="mt-6">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Business Name</TableHead>
            <TableHead>Address</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Website</TableHead>
            <TableHead>Chatbot Status</TableHead>
            <TableHead>Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {results?.map((result) => (
            <TableRow key={result.id}>
              <TableCell>{result.business_name}</TableCell>
              <TableCell>{result.address}</TableCell>
              <TableCell>{result.phone_number}</TableCell>
              <TableCell>{result.website_url}</TableCell>
              <TableCell>
                {result.has_chatbot === null
                  ? "Not analyzed"
                  : result.has_chatbot
                  ? "Has chatbot"
                  : "No chatbot"}
              </TableCell>
              <TableCell>
                {result.website_url && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleAnalyze(result.website_url!, result.id)}
                    disabled={result.analysis_status === "processing"}
                  >
                    {result.analysis_status === "processing"
                      ? "Analyzing..."
                      : "Analyze"}
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
