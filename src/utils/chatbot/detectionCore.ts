
import { supabase } from '@/integrations/supabase/client';
import { ChatbotDetectionResponse } from '@/types/chatbot';
import { toast } from 'sonner';
import { isKnownFalsePositive, formatUrl } from './urlValidation';

/**
 * Detects chatbot presence on a website
 */
export const detectChatbot = async (url: string): Promise<ChatbotDetectionResponse> => {
  try {
    console.log('Analyzing URL:', url);
    
    if (!url || url.trim() === '') {
      console.error('Empty URL provided to detectChatbot');
      return {
        status: 'Error: Empty URL',
        chatSolutions: [],
        lastChecked: new Date().toISOString()
      };
    }
    
    // Check if this is a known false positive before even making the request
    if (isKnownFalsePositive(url)) {
      console.log('Known false positive site detected:', url);
      return {
        status: 'No chatbot detected (verified)',
        chatSolutions: [],
        lastChecked: new Date().toISOString()
      };
    }
    
    // Format the URL properly if needed
    const formattedUrl = formatUrl(url);
    console.log('Formatted URL for analysis:', formattedUrl);
    
    // Call the Supabase edge function with enhanced verification options and retry mechanism
    const maxRetries = 3;
    let lastError = null;
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          console.log(`Retry attempt ${attempt} for ${url}`);
          await new Promise(resolve => setTimeout(resolve, 1000)); // Wait before retry
        }
        
        const { data, error } = await supabase.functions.invoke('analyze-website', {
          body: { 
            urls: [formattedUrl],
            debug: true,
            verifyResults: true,
            deepVerification: true,
            smartDetection: true,
            confidenceThreshold: 0.12, // Further lowered threshold for better recall
            checkFunctionality: true,
            retryFailures: true,
            timeout: 18000, // Increased timeout for more thorough analysis
            useEnhancedDetection: true, // Signal to use the enhanced detection algorithm
            useAdvancedDetection: true, // New flag to use the advanced provider-specific detection
            detectHiddenChatbots: true, // Try to find chatbots that might be hidden initially
            ignoreVisibilityChecks: true // Skip visibility checks which can be unreliable
          }
        });

        if (error) {
          console.error(`Error analyzing website (attempt ${attempt + 1}):`, error);
          lastError = error;
          continue; // Try again
        }

        console.log('Analysis result from edge function with advanced verification:', data);
        
        // Return the raw data to be processed by the processor
        return data;
      } catch (attemptError) {
        console.error(`Error in attempt ${attempt + 1}:`, attemptError);
        lastError = attemptError;
      }
    }
    
    // If all retries failed, return error
    console.error('All retry attempts failed in detectChatbot:', lastError);
    toast.error('Failed to analyze website after multiple attempts');
    return {
      status: 'Error analyzing URL after retries',
      chatSolutions: [],
      lastChecked: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error in detectChatbot:', error);
    toast.error('Failed to analyze website: ' + (error instanceof Error ? error.message : 'Unknown error'));
    return {
      status: 'Error analyzing URL',
      chatSolutions: [],
      lastChecked: new Date().toISOString()
    };
  }
};
