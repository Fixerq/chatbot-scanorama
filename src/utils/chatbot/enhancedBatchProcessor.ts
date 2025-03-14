
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
    // Process in larger batches for better performance
    const batchSize = 8; // Increased from 3 to 8
    let processedResults: Result[] = [];
    
    // Process in batches to prevent overloading
    for (let i = 0; i < results.length; i += batchSize) {
      const batch = results.slice(i, i + batchSize);
      console.log(`Processing batch ${i/batchSize + 1} of ${Math.ceil(results.length/batchSize)}`);
      
      // Update status of results in this batch to indicate active analysis
      const batchWithAnalysisStatus = batch.map(result => ({
        ...result,
        status: 'Analyzing chatbot features...'
      }));
      
      // Add the batch with updated status to processed results immediately
      processedResults = [...processedResults, ...batchWithAnalysisStatus];
      
      // Now process the batch for actual detection
      const batchResults = await processBatch(batch);
      
      // Update processed results with the analyzed batch
      processedResults = processedResults.map(result => {
        const analyzedResult = batchResults.find(r => r.url === result.url);
        if (analyzedResult) {
          return analyzedResult;
        }
        return result;
      });
      
      // Short delay between batches to prevent rate limiting
      if (i + batchSize < results.length) {
        await new Promise(resolve => setTimeout(resolve, 500)); // Reduced from 1000ms to 500ms
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
