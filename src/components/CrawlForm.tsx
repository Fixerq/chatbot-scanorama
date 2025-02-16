
import { useState, useEffect } from 'react';
import { useToast } from "@/components/ui/use-toast"; 
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Card } from "@/components/ui/card";
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

interface CrawlResult {
  success: boolean;
  status?: string;
  completed?: number;
  total?: number;
  creditsUsed?: number;
  expiresAt?: string;
  data?: any[];
}

interface CrawlRecord {
  id: string;
  url: string;
  status: string;
  result: CrawlResult | null;
  error?: string;
  user_id?: string;
  started_at: string;
  completed_at?: string;
  analyzed?: boolean;
}

export const CrawlForm = () => {
  const { toast } = useToast();
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [crawlResult, setCrawlResult] = useState<CrawlResult | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setProgress(0);
    setCrawlResult(null);
    
    try {
      console.log('Starting crawl for URL:', url);
      const { data, error } = await supabase.functions.invoke('crawl-website', {
        body: { url }
      });

      if (error) {
        console.error('Crawl error:', error);
        toast({
          title: "Error",
          description: error.message || "Failed to crawl website",
          variant: "destructive",
          duration: 3000,
        });
        return;
      }

      if (data.success) {
        toast({
          title: "Success",
          description: "Website crawl initiated",
          duration: 3000,
        });

        // Subscribe to real-time updates
        const channel = supabase
          .channel(`crawl-${data.crawlId}`)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'crawl_results',
              filter: `id=eq.${data.crawlId}`
            },
            (payload) => {
              console.log('Crawl update:', payload);
              if (payload.new && (payload.new as CrawlRecord).result) {
                const record = payload.new as CrawlRecord;
                if (record.result) {
                  setCrawlResult(record.result);
                  if (record.result.status === 'completed') {
                    toast({
                      title: "Crawl Completed",
                      description: "Website analysis is complete",
                      duration: 3000,
                    });
                  } else if (record.result.status === 'failed') {
                    toast({
                      title: "Crawl Failed",
                      description: "Failed to analyze website",
                      variant: "destructive",
                      duration: 3000,
                    });
                  }
                }
              }
            }
          )
          .subscribe();

        // Set initial result if available
        if (data.result) {
          setCrawlResult(data.result);
        }

        return () => {
          supabase.removeChannel(channel);
        };
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to crawl website",
          variant: "destructive",
          duration: 3000,
        });
      }
    } catch (error) {
      console.error('Error crawling website:', error);
      toast({
        title: "Error",
        description: "Failed to crawl website",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
      setProgress(100);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-6 backdrop-blur-sm bg-white/30 dark:bg-black/30 rounded-lg shadow-lg border border-gray-200 dark:border-gray-800 transition-all duration-300 hover:shadow-xl">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <label htmlFor="url" className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Website URL
          </label>
          <Input
            id="url"
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="w-full transition-all duration-200 focus:ring-2 focus:ring-offset-2 focus:ring-gray-400"
            placeholder="https://example.com"
            required
          />
        </div>
        {isLoading && (
          <Progress value={progress} className="w-full" />
        )}
        <Button
          type="submit"
          disabled={isLoading}
          className="w-full bg-gray-900 hover:bg-gray-800 text-white transition-all duration-200"
        >
          {isLoading ? (
            <div className="flex items-center space-x-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Crawling...</span>
            </div>
          ) : (
            "Start Crawl"
          )}
        </Button>
      </form>

      {crawlResult && (
        <Card className="mt-6 p-4">
          <h3 className="text-lg font-semibold mb-2">Crawl Results</h3>
          <div className="space-y-2 text-sm">
            <p>Status: {crawlResult.status}</p>
            {crawlResult.completed !== undefined && (
              <p>Completed Pages: {crawlResult.completed}</p>
            )}
            {crawlResult.total !== undefined && (
              <p>Total Pages: {crawlResult.total}</p>
            )}
            {crawlResult.creditsUsed !== undefined && (
              <p>Credits Used: {crawlResult.creditsUsed}</p>
            )}
            {crawlResult.expiresAt && (
              <p>Expires At: {new Date(crawlResult.expiresAt).toLocaleString()}</p>
            )}
            {crawlResult.data && (
              <div className="mt-4">
                <p className="font-semibold mb-2">Crawled Data:</p>
                <pre className="bg-gray-100 dark:bg-gray-800 p-2 rounded overflow-auto max-h-60">
                  {JSON.stringify(crawlResult.data, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
};
