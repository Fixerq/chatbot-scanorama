
import { ChatbotDetectionResponse } from '@/types/chatbot';
import { detectChatbot } from './detectionCore';
import { processAnalysisResult } from './resultProcessor';

/**
 * Main function to detect chatbots and process results
 * Uses the multi-stage detection pipeline with improved error handling
 */
export const detectChatbotWithProcessing = async (url: string): Promise<ChatbotDetectionResponse> => {
  try {
    // Get the detection data using the multi-stage pipeline
    const rawData = await detectChatbot(url);
    
    // Process the raw data into a standardized format
    return processAnalysisResult(rawData);
  } catch (error) {
    console.error('Error in chatbot detection pipeline:', error);
    
    // Return a graceful fallback response instead of throwing
    return {
      status: "Error during analysis",
      chatSolutions: [],
      confidence: 0,
      verificationStatus: "unknown",
      lastChecked: new Date().toISOString()
    };
  }
};

// Re-export the detectChatbotWithProcessing function with the new name for backward compatibility
export { detectChatbotWithProcessing as detectChatbot };
