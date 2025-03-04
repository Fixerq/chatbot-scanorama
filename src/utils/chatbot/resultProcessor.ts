
import { ChatbotDetectionResponse } from '@/types/chatbot';
import { formatAdvancedDetectionResult } from './advancedDetection';

/**
 * Processes the raw analysis result from the edge function
 */
export function processAnalysisResult(data: any): ChatbotDetectionResponse {
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
          verificationStatus: 'verified',
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
    
    // Very permissive confidence checking with extremely low threshold
    if (!result.hasChatbot || 
       (result.confidence !== undefined && result.confidence < 0.12) || 
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
