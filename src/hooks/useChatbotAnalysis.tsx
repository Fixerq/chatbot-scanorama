import { Result } from '@/components/ResultsTable';
import { detectChatbot } from '@/utils/chatbotDetection';
import { ChatbotDetectionResponse } from '@/types/chatbot';

export const useChatbotAnalysis = () => {
  const analyzeChatbots = async (results: Result[]): Promise<Result[]> => {
    const analyzedResults = await Promise.all(
      results.map(async (result) => {
        if (!result.url) return result;

        try {
          const response: ChatbotDetectionResponse = await detectChatbot(result.url);
          return {
            ...result,
            status: response.status,
            details: {
              ...result.details,
              chatSolutions: response.chatSolutions || [],
              lastChecked: response.lastChecked
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
    return analyzedResults;
  };

  return { analyzeChatbots };
};