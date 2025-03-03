
import { Result } from '@/components/ResultsTable';
import { processResultsWithEnhancedDetection } from '@/utils/chatbot/enhancedBatchProcessor';
import { performTertiaryAnalysis } from '@/utils/chatbot/tertiaryDetection';

export const useChatbotAnalysis = () => {
  const analyzeChatbots = async (results: Result[]): Promise<Result[]> => {
    if (!results || results.length === 0) {
      console.log('No results to analyze');
      return [];
    }
    
    // Process all results with enhanced detection
    const processedResults = await processResultsWithEnhancedDetection(results);
    
    // Perform tertiary analysis to find chatbots with various detection methods
    const { updatedResults } = performTertiaryAnalysis(processedResults);
    
    console.log('Completed chatbot analysis with advanced detection capabilities');
    
    return updatedResults;
  };

  return { analyzeChatbots };
};

export default useChatbotAnalysis;
