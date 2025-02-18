
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
    const unsubscribe = subscribeToAnalysisResults();
    return () => {
      unsubscribe();
    };
  }, [subscribeToAnalysisResults]);

  const handleTest = async () => {
    setIsAnalyzing(true);
    try {
      await testAnalysis();
      console.log('Analysis initiated');
    } catch (error) {
      console.error('Analysis failed:', error);
      setIsAnalyzing(false);
    }
  };

  // Show results if available
  const result = results['https://psychiatry-uk.com/'];
  
  return (
    <div className="p-4 space-y-4">
      <Button 
        onClick={handleTest}
        disabled={isAnalyzing}
      >
        {isAnalyzing ? 'Analyzing...' : 'Test psychiatry-uk.com'}
      </Button>

      {isAnalyzing && !result && <ProcessingIndicator />}

      {result && (
        <div className="mt-4 p-4 bg-background rounded-lg border">
          <h3 className="font-medium mb-2">Analysis Results:</h3>
          <div className="space-y-2">
            <p>Status: {result.status}</p>
            <p>Has Chatbot: {result.has_chatbot ? 'Yes' : 'No'}</p>
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
