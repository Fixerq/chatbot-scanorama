
import { Result } from '@/components/ResultsTable';
import { processResultsWithEnhancedDetection } from '@/utils/chatbot/enhancedBatchProcessor';
import { performTertiaryAnalysis } from '@/utils/chatbot/tertiaryDetection';
import { useState } from 'react';

export const useChatbotAnalysis = () => {
  const [analysisStage, setAnalysisStage] = useState<string>('initial');
  
  const analyzeChatbots = async (results: Result[]): Promise<Result[]> => {
    if (!results || results.length === 0) {
      console.log('No results to analyze');
      return [];
    }
    
    // Update analysis stage
    setAnalysisStage('processing');
    console.log(`Starting immediate forced analysis for ${results.length} results`);
    
    // Process all results with enhanced detection (now with higher batch size)
    const processedResults = await processResultsWithEnhancedDetection(results);
    
    // Update analysis stage
    setAnalysisStage('verification');
    
    // Perform tertiary analysis to find chatbots with various detection methods
    const { updatedResults } = performTertiaryAnalysis(processedResults);
    
    // Update analysis stage
    setAnalysisStage('complete');
    console.log('Completed forced chatbot analysis with advanced detection capabilities');
    
    return updatedResults;
  };

  return { 
    analyzeChatbots,
    analysisStage 
  };
};

export default useChatbotAnalysis;
