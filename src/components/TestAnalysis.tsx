
import React from 'react';
import { Button } from "@/components/ui/button";
import { testAnalysis } from '@/test-analysis';
import { toast } from 'sonner';

export function TestAnalysis() {
  const [isAnalyzing, setIsAnalyzing] = React.useState(false);

  const handleTest = async () => {
    setIsAnalyzing(true);
    try {
      await testAnalysis();
      toast.success('Analysis completed! Check the console for results.');
    } catch (error) {
      console.error('Analysis failed:', error);
      toast.error('Analysis failed. Check the console for details.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="p-4">
      <Button 
        onClick={handleTest}
        disabled={isAnalyzing}
      >
        {isAnalyzing ? 'Analyzing...' : 'Test psychiatry-uk.com'}
      </Button>
    </div>
  );
}
