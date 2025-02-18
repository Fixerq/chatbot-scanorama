
import React from 'react';
import { Button } from "@/components/ui/button";
import { testAnalysis } from '@/test-analysis';
import { toast } from 'sonner';
import { useRealtimeAnalysis } from '@/hooks/useRealtimeAnalysis';
import ProcessingIndicator from '@/components/ProcessingIndicator';

export function TestAnalysis() {
  const [isAnalyzing, setIsAnalyzing] = React.useState(false);
  const { subscribeToAnalysisResults, results } = useRealtimeAnalysis();

  React.useEffect(() => {
    console.log('Setting up analysis subscription');
    const unsubscribe = subscribeToAnalysisResults();
    return () => {
      console.log('Cleaning up analysis subscription');
      unsubscribe();
    };
  }, [subscribeToAnalysisResults]);

  const handleTest = async () => {
    if (isAnalyzing) {
      console.log('Analysis already in progress, skipping...');
      return;
    }

    setIsAnalyzing(true);
    try {
      console.log('Initiating analysis...');
      await testAnalysis();
    } catch (error) {
      console.error('Analysis failed:', error);
      toast.error('Analysis failed', {
        description: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    }
  };

  // Get the result for psychiatry-uk.com
  const result = results['https://psychiatry-uk.com/'];
  
  // Update analyzing state based on result status
  React.useEffect(() => {
    if (result?.status === 'completed' || result?.status === 'failed') {
      console.log('Analysis completed with status:', result.status);
      setIsAnalyzing(false);
    }
  }, [result?.status]);

  return (
    <div className="p-4 space-y-4">
      <Button 
        onClick={handleTest}
        disabled={isAnalyzing}
        className="w-full sm:w-auto"
      >
        {isAnalyzing ? 'Analyzing...' : 'Test psychiatry-uk.com'}
      </Button>

      {isAnalyzing && !result && (
        <div className="mt-4">
          <ProcessingIndicator />
          <p className="text-sm text-muted-foreground mt-2">
            Analyzing website, please wait...
          </p>
        </div>
      )}

      {result && (
        <div className="mt-4 p-4 bg-background rounded-lg border">
          <h3 className="font-medium mb-2">Analysis Results:</h3>
          <div className="space-y-2">
            <p>Status: <span className="font-medium">{result.status}</span></p>
            <p>Has Chatbot: <span className="font-medium">{result.has_chatbot ? 'Yes' : 'No'}</span></p>
            {result.error && (
              <p className="text-red-500">Error: {result.error}</p>
            )}
            {result.has_chatbot && result.chatbot_solutions?.length > 0 && (
              <div>
                <p className="font-medium">Detected Solutions:</p>
                <ul className="list-disc pl-4">
                  {result.chatbot_solutions.map((solution, index) => (
                    <li key={index}>{solution}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
