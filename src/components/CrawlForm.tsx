
import { useState } from 'react';
import { useToast } from "@/components/ui/use-toast"; 
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Card } from "@/components/ui/card";
import { Play } from "lucide-react";
import EmailResults from './EmailResults';
import { useSubscriptionStatus } from '@/hooks/useSubscriptionStatus';
import { createAnalysisRequest, invokeAnalysisFunction } from '@/services/analysisService';

export const CrawlForm = () => {
  const { toast } = useToast();
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [crawlResult, setCrawlResult] = useState<any | null>(null);
  const { subscriptionData, isLoading: isSubscriptionLoading } = useSubscriptionStatus();

  const startAnalysis = async () => {
    if (!url) {
      toast({
        title: "URL Required",
        description: "Please enter a URL to analyze",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    if (!isSubscriptionLoading && subscriptionData?.searchesRemaining === 0) {
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
      const request = await createAnalysisRequest(url);
      console.log('Analysis request created:', request);
      
      const result = await invokeAnalysisFunction(url, request.id);
      console.log('Analysis completed:', result);
      
      setCrawlResult(result);
      toast({
        title: "Success",
        description: "Website analyzed successfully",
        duration: 3000,
      });
    } catch (error) {
      console.error('Error analyzing website:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to analyze website",
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
      <div className="space-y-6">
        <div className="space-y-2">
          <label htmlFor="url" className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Website URL
          </label>
          <div className="flex gap-2">
            <Input
              id="url"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="flex-1 transition-all duration-200 focus:ring-2 focus:ring-offset-2 focus:ring-gray-400"
              placeholder="https://example.com"
              required
            />
            <Button
              type="button"
              onClick={startAnalysis}
              disabled={isLoading || (!isSubscriptionLoading && subscriptionData?.searchesRemaining === 0)}
              className="bg-gray-900 hover:bg-gray-800 text-white transition-all duration-200"
            >
              <Play className="h-4 w-4" />
            </Button>
          </div>
        </div>
        {isLoading && (
          <Progress value={progress} className="w-full" />
        )}
        
        {!isSubscriptionLoading && subscriptionData && subscriptionData.searchesRemaining !== -1 && (
          <p className="text-sm text-muted-foreground text-center">
            {subscriptionData.searchesRemaining} searches remaining
          </p>
        )}

        {crawlResult && (
          <>
            <Card className="mt-6 p-4">
              <h3 className="text-lg font-semibold mb-2">Analysis Results</h3>
              <div className="space-y-2 text-sm">
                <p>Status: {crawlResult.status}</p>
                {crawlResult.chatSolutions?.length > 0 && (
                  <p>Chat Solutions: {crawlResult.chatSolutions.join(', ')}</p>
                )}
                <p>Last Checked: {new Date(crawlResult.lastChecked).toLocaleString()}</p>
              </div>
            </Card>
            
            {crawlResult.emails && <EmailResults emails={crawlResult.emails} />}
          </>
        )}
      </div>
    </div>
  );
};

