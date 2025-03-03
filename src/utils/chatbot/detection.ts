
import { ChatbotDetectionResponse } from '@/types/chatbot';
import { detectChatbot } from './detectionCore';
import { processAnalysisResult } from './resultProcessor';

/**
 * Main function to detect chatbots and process results
 */
export const detectChatbotWithProcessing = async (url: string): Promise<ChatbotDetectionResponse> => {
  // Get the raw detection data
  const rawData = await detectChatbot(url);
  
  // Process the raw data into a standardized format
  return processAnalysisResult(rawData);
};

// Re-export the detectChatbot function with the new name for backward compatibility
export { detectChatbotWithProcessing as detectChatbot };
