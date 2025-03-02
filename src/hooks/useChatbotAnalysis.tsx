
import { Result } from '@/components/ResultsTable';
import { toast } from 'sonner';
import { processBatch } from '@/utils/chatbot/batchProcessor';
import { performSecondaryDetection } from '@/utils/chatbot/secondaryDetection';

export const useChatbotAnalysis = () => {
  const analyzeChatbots = async (results: Result[]): Promise<Result[]> => {
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
      
      // Check if any results have chatbots with lower confidence threshold
      const chatbotCount = processedResults.filter(r => 
        r.details?.chatSolutions && 
        r.details.chatSolutions.length > 0
      ).length;
      
      if (chatbotCount > 0) {
        toast.success(`Found ${chatbotCount} websites with verified chatbots!`);
      } else {
        toast.info('No chatbots detected. Trying alternative detection methods...');
        
        // Apply a secondary analysis pass using more permissive detection
        const secondPassResults = performSecondaryDetection(processedResults);
        
        // Count chatbots after secondary analysis
        const secondPassChatbotCount = secondPassResults.filter(r => 
          r.details?.chatSolutions && 
          r.details.chatSolutions.length > 0
        ).length;
        
        if (secondPassChatbotCount > chatbotCount) {
          toast.success(`Found ${secondPassChatbotCount} websites with likely chatbots after deeper analysis!`);
          return secondPassResults;
        }
      }
      
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

  return { analyzeChatbots };
};

export default useChatbotAnalysis;
