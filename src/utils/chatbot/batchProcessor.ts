
import { Result } from '@/components/ResultsTable';
import { detectChatbot, isKnownFalsePositive } from '@/utils/chatbot';
import { ChatbotDetectionResponse } from '@/types/chatbot';

/**
 * Processes a batch of URLs for chatbot detection
 */
export const processBatch = async (batch: Result[]): Promise<Result[]> => {
  return await Promise.all(
    batch.map(async (result) => {
      if (!result.url) {
        console.warn('Skipping analysis for result with no URL');
        return {
          ...result,
          status: 'Error: Missing URL'
        };
      }

      // Check if this is a known false positive before processing
      if (isKnownFalsePositive(result.url)) {
        console.log(`Known false positive site detected: ${result.url}`);
        return {
          ...result,
          status: 'No chatbot detected (verified)',
          details: {
            ...result.details,
            title: result.details?.title || 'Business Name',
            chatSolutions: [],
            verificationStatus: 'verified',
            confidence: 0,
            lastChecked: new Date().toISOString()
          }
        };
      }

      try {
        // Add retry logic for more reliability
        let attempts = 0;
        let response: ChatbotDetectionResponse | null = null;
        
        while (attempts < 3 && (!response || response.status?.includes('Error'))) {
          if (attempts > 0) {
            console.log(`Retry attempt ${attempts} for ${result.url}`);
            await new Promise(resolve => setTimeout(resolve, 1000)); // Wait before retry
          }
          
          console.log(`Analyzing URL with enhanced detection: ${result.url}`);
          response = await detectChatbot(result.url);
          attempts++;
        }
        
        if (!response) {
          throw new Error('Failed to analyze URL after retries');
        }
        
        // Log detailed response for debugging
        console.log(`Analysis response for ${result.url}:`, response);
        
        // Enhanced verification with MUCH lower confidence threshold for more aggressive detection
        const hasChatbot = response.chatSolutions && 
                         response.chatSolutions.length > 0 && 
                         !response.status?.toLowerCase().includes('no chatbot') &&
                         (response.confidence === undefined || response.confidence >= 0.1); // Lower threshold from 0.15 to 0.1
        
        // Only include chat solutions if they passed verification
        let validChatSolutions = hasChatbot ? response.chatSolutions : [];
        
        // Ensure all "Custom Chat" occurrences are replaced with "Website Chatbot"
        validChatSolutions = validChatSolutions?.map(solution => {
          if (solution === "Custom Chat") {
            return "Website Chatbot";
          }
          return solution;
        }) || [];
        
        // If we don't have any specific solutions but we detected a chatbot, add a generic one
        if (hasChatbot && (!validChatSolutions || validChatSolutions.length === 0)) {
          validChatSolutions = ["Website Chatbot"];
        }
        
        return {
          ...result,
          status: hasChatbot ? 'Chatbot detected' : 'No chatbot detected',
          details: {
            ...result.details,
            title: result.details?.title || 'Business Name',
            chatSolutions: validChatSolutions,
            confidence: response.confidence,
            verificationStatus: response.verificationStatus,
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
};
