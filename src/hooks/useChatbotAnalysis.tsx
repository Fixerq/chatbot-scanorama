
import { Result } from '@/components/ResultsTable';
import { detectChatbot } from '@/utils/chatbotDetection';
import { ChatbotDetectionResponse } from '@/types/chatbot';

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
            return result;
          }

          try {
            console.log(`Analyzing URL: ${result.url}`);
            const response: ChatbotDetectionResponse = await detectChatbot(result.url);
            
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
      return analyzedResults;
    } catch (error) {
      console.error('Error in batch analysis:', error);
      return results.map(result => ({
        ...result,
        status: 'Error in analysis process'
      }));
    }
  };

  return { analyzeChatbots };
};
