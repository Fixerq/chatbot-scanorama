
import { Result } from '@/components/ResultsTable';
import { detectChatbot } from '@/utils/chatbotDetection';
import { ChatbotDetectionResponse } from '@/types/chatbot';
import { toast } from 'sonner';

export const useChatbotAnalysis = () => {
  const analyzeChatbots = async (results: Result[]): Promise<Result[]> => {
    if (!results || results.length === 0) {
      console.log('No results to analyze');
      return [];
    }
    
    console.log(`Analyzing ${results.length} results for chatbots`);
    
    try {
      const analyzedResults = await Promise.all(
        results.map(async (result) => {
          if (!result.url) {
            console.warn('Skipping analysis for result with no URL');
            return {
              ...result,
              status: 'Error: Missing URL'
            };
          }

          try {
            console.log(`Analyzing URL: ${result.url}`);
            const response: ChatbotDetectionResponse = await detectChatbot(result.url);
            
            // Log detailed response for debugging
            console.log(`Analysis response for ${result.url}:`, response);
            
            const hasChatbot = response.chatSolutions && response.chatSolutions.length > 0;
            
            return {
              ...result,
              status: response.status || 'Analyzed',
              details: {
                ...result.details,
                title: result.details?.title || 'Business Name',
                chatSolutions: response.chatSolutions || [],
                lastChecked: response.lastChecked || new Date().toISOString()
              }
            };
          } catch (error) {
            console.error(`Error analyzing ${result.url}:`, error);
            return {
              ...result,
              status: 'Error analyzing URL'
            };
          }
        })
      );
      
      console.log('Analysis completed. Results:', analyzedResults.length);
      
      // Check if any results have chatbots
      const chatbotCount = analyzedResults.filter(r => 
        r.details?.chatSolutions && r.details.chatSolutions.length > 0
      ).length;
      
      if (chatbotCount > 0) {
        toast.success(`Found ${chatbotCount} websites with chatbots!`);
      } else {
        toast.info('No chatbots detected in the analyzed websites.');
      }
      
      return analyzedResults;
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
