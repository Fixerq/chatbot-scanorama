import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Result } from '../ResultsTable';
import { useUrlProcessor } from '@/hooks/useUrlProcessor';
interface AnalyzeActionsProps {
  results: Result[];
}
const AnalyzeActions = ({
  results
}: AnalyzeActionsProps) => {
  const {
    toast
  } = useToast();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const {
    processSearchResults
  } = useUrlProcessor();
  const analyzeAll = async () => {
    setIsAnalyzing(true);
    try {
      await processSearchResults(results);
      toast({
        title: "Success",
        description: "Analysis started for all websites",
        duration: 3000
      });
    } catch (error) {
      console.error('Bulk analysis error:', error);
      toast({
        title: "Error",
        description: "Failed to start analysis",
        variant: "destructive",
        duration: 3000
      });
    } finally {
      setIsAnalyzing(false);
    }
  };
  return;
};
export default AnalyzeActions;