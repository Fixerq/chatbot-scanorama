
import { ChatbotDetectionResponse } from '@/types/chatbot';
import { detectChatbot } from './detectionCore';
import { processAnalysisResult } from './resultProcessor';

/**
 * Main function to detect chatbots and process results
 * Uses the new multi-stage detection pipeline
 */
export const detectChatbotWithProcessing = async (url: string): Promise<ChatbotDetectionResponse> => {
  // Get the detection data using the multi-stage pipeline
  const rawData = await detectChatbot(url);
  
  // Process the raw data into a standardized format
  return processAnalysisResult(rawData);
};

// Re-export the detectChatbot function with the new name for backward compatibility
export { detectChatbotWithProcessing as detectChatbot };
