import { useState } from 'react';
import { useToast } from "@/components/ui/use-toast"; 
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { FirecrawlService } from '@/utils/firecrawl/FirecrawlService';
import { Card } from "@/components/ui/card";
import EmailResults from './EmailResults';
import { useSubscriptionStatus } from '@/hooks/useSubscriptionStatus';
import { toast } from 'sonner';

interface CrawlResult {
  success: boolean;
  status?: string;
  completed?: number;
  total?: number;
  creditsUsed?: number;
  expiresAt?: string;
  data?: any[];
  emails?: string[];
}

export const CrawlForm = () => {
  const { toast } = useToast();
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [crawlResult, setCrawlResult] = useState<CrawlResult | null>(null);
  const { subscriptionData } = useSubscriptionStatus();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!subscriptionData) {
      toast({
        title: "Error",
        description: "Unable to verify subscription status",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    if (subscriptionData.searchesRemaining === 0) {
      toast({
        title: "Search limit reached",
        description: "Please upgrade your plan to continue searching",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }
    
    setIsLoading(true);
    setProgress(0);
    setCrawlResult(null);
    
    try {
      console.log('Starting crawl for URL:', url);
      const result = await FirecrawlService.crawlWebsite(url);
      
      if (result.success) {
        toast({
          title: "Success",
          description: "Website crawled successfully",
          duration: 3000,
        });
        setCrawlResult(result.data);
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to crawl website",
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
          disabled={isLoading || (subscriptionData?.searchesRemaining === 0)}
          className="w-full bg-gray-900 hover:bg-gray-800 text-white transition-all duration-200"
        >
          {isLoading ? "Crawling..." : "Start Crawl"}
        </Button>
        
        {subscriptionData && subscriptionData.searchesRemaining !== -1 && (
          <p className="text-sm text-muted-foreground text-center">
            {subscriptionData.searchesRemaining} searches remaining
          </p>
        )}
      </form>

      {crawlResult && (
        <>
          <Card className="mt-6 p-4">
            <h3 className="text-lg font-semibold mb-2">Crawl Results</h3>
            <div className="space-y-2 text-sm">
              <p>Status: {crawlResult.status}</p>
              <p>Completed Pages: {crawlResult.completed}</p>
              <p>Total Pages: {crawlResult.total}</p>
              <p>Credits Used: {crawlResult.creditsUsed}</p>
              <p>Expires At: {new Date(crawlResult.expiresAt || '').toLocaleString()}</p>
            </div>
          </Card>
          
          {crawlResult.emails && <EmailResults emails={crawlResult.emails} />}
        </>
      )}
    </div>
  );
};