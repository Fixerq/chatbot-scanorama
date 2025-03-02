
import { Result } from '@/components/ResultsTable';
import { toast } from 'sonner';
import { processBatch } from '@/utils/chatbot/batchProcessor';

/**
 * Processes multiple batches of results with enhanced detection capabilities
 */
export const processResultsWithEnhancedDetection = async (results: Result[]): Promise<Result[]> => {
  if (!results || results.length === 0) {
    console.log('No results to analyze');
    return [];
  }
  
  console.log(`Analyzing ${results.length} results for chatbots with enhanced detection`);
  
  try {
    // Process in smaller batches for better reliability
    const batchSize = 3;
    let processedResults: Result[] = [];
    
    // Process in batches to prevent overloading
    for (let i = 0; i < results.length; i += batchSize) {
      const batch = results.slice(i, i + batchSize);
      console.log(`Processing batch ${i/batchSize + 1} of ${Math.ceil(results.length/batchSize)}`);
      
      const batchResults = await processBatch(batch);
      processedResults = [...processedResults, ...batchResults];
      
      // Short delay between batches to prevent rate limiting
      if (i + batchSize < results.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    console.log('Analysis completed with enhanced detection. Results:', processedResults.length);
    return processedResults;
  } catch (error) {
    console.error('Error in batch analysis:', error);
    toast.error('Error during analysis: ' + (error instanceof Error ? error.message : 'Unknown error'));
    return results.map(result => ({
      ...result,
      status: 'Error in analysis process'
    }));
  }
};
