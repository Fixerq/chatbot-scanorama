
import { supabase } from '@/integrations/supabase/client';
import { ChatbotDetectionResponse } from '@/types/chatbot';
import { toast } from 'sonner';
import { isKnownFalsePositive, formatUrl } from './urlValidation';
import { formatAdvancedDetectionResult } from './advancedDetection';

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
            confidenceThreshold: 0.15, // Further lowered threshold for better recall
            checkFunctionality: true,
            retryFailures: true,
            timeout: 15000, // Increased timeout for more thorough analysis
            useEnhancedDetection: true, // Signal to use the enhanced detection algorithm
            useAdvancedDetection: true // New flag to use the advanced provider-specific detection
          }
        });

        if (error) {
          console.error(`Error analyzing website (attempt ${attempt + 1}):`, error);
          lastError = error;
          continue; // Try again
        }

        console.log('Analysis result from edge function with advanced verification:', data);

        return processAnalysisResult(data);
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

/**
 * Processes the raw analysis result from the edge function
 */
function processAnalysisResult(data: any): ChatbotDetectionResponse {
  // Check if data is an array (new format) or object (old format)
  if (Array.isArray(data) && data.length > 0) {
    const result = data[0];
    
    // Check if we have advanced detection results
    if (result.advancedDetection) {
      console.log('Processing advanced detection results:', result.advancedDetection);
      
      const hasChatbot = result.advancedDetection.hasChatbot;
      const advancedConfidence = result.advancedDetection.confidence;
      const confidence = advancedConfidence === 'high' ? 0.9 : 
                         advancedConfidence === 'medium' ? 0.7 : 
                         advancedConfidence === 'low' ? 0.3 : 0;
      
      if (!hasChatbot) {
        return {
          status: 'No chatbot detected',
          chatSolutions: [],
          confidence: 0,
          verificationStatus: 'verified', // We trust the advanced detection
          lastChecked: new Date().toISOString(),
          advancedDetection: formatAdvancedDetectionResult(result.advancedDetection)
        };
      }
      
      // Extract provider information
      let solutions = [];
      const provider = result.advancedDetection.provider;
      
      if (provider && provider !== 'Unknown' && provider !== 'None' && provider !== 'Custom') {
        solutions.push(provider);
      } else {
        solutions.push('Website Chatbot');
      }
      
      return {
        status: 'Chatbot detected',
        chatSolutions: solutions,
        confidence: confidence,
        verificationStatus: 'verified',
        lastChecked: new Date().toISOString(),
        advancedDetection: formatAdvancedDetectionResult(result.advancedDetection)
      };
    }
    
    // Check if we have enhanced detection results
    if (result.enhancedDetection) {
      console.log('Processing enhanced detection results:', result.enhancedDetection);
      
      const hasChatbot = result.enhancedDetection.hasChatbot;
      const confidence = result.enhancedDetection.confidence === 'high' ? 0.9 : 
                        result.enhancedDetection.confidence === 'medium' ? 0.7 : 0.3;
      
      if (!hasChatbot) {
        return {
          status: 'No chatbot detected',
          chatSolutions: [],
          confidence: 0,
          verificationStatus: 'verified', // We trust the enhanced detection
          lastChecked: new Date().toISOString(),
          enhancedDetection: result.enhancedDetection
        };
      }
      
      // Extract provider information
      let solutions = [];
      const provider = result.enhancedDetection.provider;
      
      if (provider && provider !== 'Unknown' && provider !== 'Custom') {
        solutions.push(provider);
      } else {
        solutions.push('Website Chatbot');
      }
      
      return {
        status: 'Chatbot detected',
        chatSolutions: solutions,
        confidence: confidence,
        verificationStatus: 'verified',
        lastChecked: new Date().toISOString(),
        enhancedDetection: result.enhancedDetection
      };
    }
    
    // More permissive confidence checking with very low threshold
    if (!result.hasChatbot || 
       (result.confidence !== undefined && result.confidence < 0.15) || 
       (result.verificationStatus === 'failed')) {
      console.log(`No chatbot detected or verification failed (${result.confidence}), marking as no chatbot`);
      return {
        status: 'No chatbot detected',
        chatSolutions: [],
        confidence: result.confidence || 0,
        verificationStatus: result.verificationStatus || 'unknown',
        lastChecked: new Date().toISOString()
      };
    }
    
    // Include all possible chat solutions with more permissive detection
    let solutions = result.solutions || result.chatSolutions || [];
    
    // Always ensure we have a valid array
    if (!Array.isArray(solutions)) {
      solutions = [];
    }
    
    // If we have indicators but no specific solutions, add a generic solution
    if (solutions.length === 0 && result.indicators && result.indicators.length > 0) {
      solutions.push("Website Chatbot");
    }
    
    // Convert all "Custom Chat" instances to the more descriptive label
    solutions = solutions.map(solution => 
      solution === "Custom Chat" ? "Website Chatbot" : solution
    );
    
    return {
      status: result.status || 'Chatbot detected',
      chatSolutions: solutions,
      confidence: result.confidence || 1,
      verificationStatus: result.verificationStatus || 'verified',
      lastChecked: new Date().toISOString()
    };
  }
  
  // Handle the original data format
  if (!data || !data.status) {
    console.warn('Edge function returned incomplete data');
    return {
      status: 'Error: Incomplete data',
      chatSolutions: [],
      lastChecked: new Date().toISOString()
    };
  }
  
  // Handle the original data format
  const hasChatbot = data.chatSolutions && data.chatSolutions.length > 0;
  
  return {
    status: hasChatbot ? 'Chatbot detected' : 'No chatbot detected',
    chatSolutions: data.chatSolutions || [],
    confidence: data.confidence || 0,
    verificationStatus: data.verificationStatus || 'unknown',
    lastChecked: data.lastChecked || new Date().toISOString()
  };
}
