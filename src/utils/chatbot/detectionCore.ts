import { supabase } from '@/integrations/supabase/client';
import { ChatbotDetectionResponse, DetectionStageResult } from '@/types/chatbot';
import { toast } from 'sonner';
import { isKnownFalsePositive, formatUrl } from './urlValidation';

/**
 * Multi-stage chatbot detection pipeline
 * Implements an efficient staged approach with early bailout for faster processing
 */
export const detectChatbot = async (url: string): Promise<ChatbotDetectionResponse> => {
  try {
    console.log('Starting multi-stage detection for URL:', url);
    
    if (!url || url.trim() === '') {
      console.error('Empty URL provided to detectChatbot');
      return {
        status: 'Error: Empty URL',
        chatSolutions: [],
        lastChecked: new Date().toISOString()
      };
    }
    
    if (isKnownFalsePositive(url)) {
      console.log('Known false positive site detected:', url);
      return {
        status: 'No chatbot detected (verified)',
        chatSolutions: [],
        lastChecked: new Date().toISOString()
      };
    }
    
    const formattedUrl = formatUrl(url);
    console.log('Formatted URL for analysis:', formattedUrl);
    
    console.log('STAGE 1: Running initial lightweight scan');
    const initialResult = await runDetectionStage(formattedUrl, {
      stageName: 'initial',
      confidenceThreshold: 0.1,
      useSmartDetection: true,
      useEnhancedDetection: false,
      useAdvancedDetection: false,
      timeout: 8000
    });
    
    if (!initialResult.proceed) {
      console.log('STAGE 1 RESULT: No chatbot detected in initial scan, stopping pipeline');
      return initialResult.response;
    }
    
    console.log('STAGE 2: Running provider-specific detection');
    const providerResult = await runDetectionStage(formattedUrl, {
      stageName: 'provider',
      confidenceThreshold: 0.3,
      useSmartDetection: true,
      useEnhancedDetection: true,
      useAdvancedDetection: true,
      suggestedProviders: initialResult.chatSolutions,
      timeout: 12000
    });
    
    if (!providerResult.proceed) {
      console.log('STAGE 2 RESULT: No specific provider detected, stopping pipeline');
      return providerResult.response;
    }
    
    console.log('STAGE 3: Running verification and false positive prevention');
    const verificationResult = await runDetectionStage(formattedUrl, {
      stageName: 'verification',
      confidenceThreshold: 0.5,
      useSmartDetection: true,
      useEnhancedDetection: true,
      useAdvancedDetection: true,
      deepVerification: true,
      verifyResults: true,
      suggestedProviders: providerResult.chatSolutions,
      timeout: 15000
    });
    
    if (!verificationResult.proceed) {
      console.log('STAGE 3 RESULT: Failed verification, likely false positive');
      return verificationResult.response;
    }
    
    console.log('STAGE 4: Running functional validation');
    const functionalResult = await runDetectionStage(formattedUrl, {
      stageName: 'functional',
      confidenceThreshold: 0.8,
      useSmartDetection: true,
      useEnhancedDetection: true,
      useAdvancedDetection: true,
      deepVerification: true,
      verifyResults: true,
      checkFunctionality: true,
      detectHiddenChatbots: true,
      suggestedProviders: verificationResult.chatSolutions,
      timeout: 18000
    });
    
    console.log('STAGE 4 RESULT: Completed full detection pipeline');
    return functionalResult.response;
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
 * Runs a single stage of the detection pipeline with appropriate parameters
 */
async function runDetectionStage(
  url: string, 
  options: {
    stageName: string;
    confidenceThreshold: number;
    useSmartDetection?: boolean;
    useEnhancedDetection?: boolean;
    useAdvancedDetection?: boolean;
    deepVerification?: boolean;
    verifyResults?: boolean;
    checkFunctionality?: boolean;
    detectHiddenChatbots?: boolean;
    suggestedProviders?: string[];
    timeout?: number;
  }
): Promise<DetectionStageResult> {
  try {
    const {
      stageName,
      confidenceThreshold,
      useSmartDetection = false,
      useEnhancedDetection = false,
      useAdvancedDetection = false,
      deepVerification = false,
      verifyResults = false,
      checkFunctionality = false,
      detectHiddenChatbots = false,
      suggestedProviders = [],
      timeout = 10000
    } = options;
    
    console.log(`Running ${stageName} stage with confidence threshold: ${confidenceThreshold}`);
    
    const { data, error } = await supabase.functions.invoke('analyze-website', {
      body: { 
        urls: [url],
        debug: true,
        verifyResults,
        deepVerification,
        smartDetection: useSmartDetection,
        confidenceThreshold,
        checkFunctionality,
        retryFailures: stageName === 'functional', // Only retry in the final stage
        timeout,
        useEnhancedDetection,
        useAdvancedDetection,
        detectHiddenChatbots,
        ignoreVisibilityChecks: stageName === 'initial', // Ignore visibility in initial scan
        suggestedProviders // Pass any providers detected in previous stages
      }
    });

    if (error) {
      console.error(`Error in ${stageName} stage:`, error);
      return {
        proceed: false,
        response: {
          status: `Error in ${stageName} stage`,
          chatSolutions: [],
          lastChecked: new Date().toISOString()
        },
        chatSolutions: []
      };
    }

    console.log(`${stageName} stage result:`, data);
    
    if (Array.isArray(data) && data.length > 0) {
      const result = data[0];
      const confidence = result.confidence || 0;
      const hasAdvancedDetection = result.advancedDetection?.hasChatbot;
      const hasEnhancedDetection = result.enhancedDetection?.hasChatbot;
      
      let providers: string[] = [];
      
      if (result.chatSolutions && result.chatSolutions.length > 0) {
        providers = result.chatSolutions;
      } else if (result.advancedDetection?.provider) {
        providers = [result.advancedDetection.provider];
      } else if (result.enhancedDetection?.provider) {
        providers = [result.enhancedDetection.provider];
      }
      
      if (providers.length > 1) {
        const genericProviders = ['Website Chatbot', 'ChatBot', 'Custom Chat'];
        const specificProviders = providers.filter(p => !genericProviders.includes(p));
        
        if (specificProviders.length > 0) {
          providers = specificProviders;
        }
      }
      
      const meetsCriteria = confidence >= options.confidenceThreshold || 
                           (stageName !== 'functional' && (hasAdvancedDetection || hasEnhancedDetection));
      
      if (!meetsCriteria) {
        return {
          proceed: false,
          response: {
            status: 'No chatbot detected',
            chatSolutions: [],
            confidence: confidence,
            verificationStatus: 'verified',
            lastChecked: new Date().toISOString()
          },
          chatSolutions: []
        };
      }
      
      if (stageName === 'functional' || confidence >= 0.6) {
        return {
          proceed: false,
          response: {
            status: 'Chatbot detected',
            chatSolutions: providers,
            confidence: confidence,
            verificationStatus: 'verified',
            lastChecked: new Date().toISOString(),
            enhancedDetection: result.enhancedDetection,
            advancedDetection: result.advancedDetection
          },
          chatSolutions: providers
        };
      }
      
      return {
        proceed: true,
        response: {
          status: `Proceeding to next stage, current confidence: ${confidence}`,
          chatSolutions: providers,
          confidence: confidence,
          verificationStatus: 'unverified',
          lastChecked: new Date().toISOString()
        },
        chatSolutions: providers
      };
    }
    
    return {
      proceed: false,
      response: {
        status: 'No chatbot detected',
        chatSolutions: [],
        lastChecked: new Date().toISOString()
      },
      chatSolutions: []
    };
  } catch (stageError) {
    console.error(`Error in ${options.stageName} stage:`, stageError);
    return {
      proceed: false,
      response: {
        status: `Error in ${options.stageName} stage`,
        chatSolutions: [],
        lastChecked: new Date().toISOString()
      },
      chatSolutions: []
    };
  }
}
