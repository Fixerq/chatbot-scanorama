
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Result } from '../ResultsTable';
import { createAnalysisRequest, invokeAnalysisFunction } from '@/services/analysisService';

interface AnalyzeActionsProps {
  results: Result[];
}

const AnalyzeActions = ({ results }: AnalyzeActionsProps) => {
  const { toast } = useToast();
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const analyzeAll = async () => {
    setIsAnalyzing(true);
    let errorCount = 0;

    try {
      await Promise.all(results.map(async (result) => {
        try {
          const request = await createAnalysisRequest(result.url);
          await invokeAnalysisFunction(result.url, request.id);
        } catch (error) {
          console.error(`Error analyzing ${result.url}:`, error);
          errorCount++;
        }
      }));

      if (errorCount > 0) {
        toast({
          title: "Warning",
          description: `Analysis completed with ${errorCount} errors`,
          variant: "destructive",
          duration: 3000,
        });
      } else {
        toast({
          title: "Success",
          description: "All websites queued for analysis",
          duration: 3000,
        });
      }
    } catch (error) {
      console.error('Bulk analysis error:', error);
      toast({
        title: "Error",
        description: "Failed to start bulk analysis",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <Button
      onClick={analyzeAll}
      disabled={isAnalyzing || results.length === 0}
      className="bg-black hover:bg-gray-800 text-white"
    >
      <Play className="h-4 w-4 mr-2" />
      Analyze All
    </Button>
  );
};

export default AnalyzeActions;
