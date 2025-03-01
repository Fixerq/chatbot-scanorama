
import { CHAT_PATTERNS, FALSE_POSITIVE_PATTERNS, FALSE_POSITIVE_DOMAINS } from './patterns';
import { detectDynamicLoading, detectChatElements, detectMetaTags, detectWebSockets } from './utils/patternDetection';
import { smartDetectChatbot } from './utils/smartDetection';

export interface AnalysisOptions {
  debug?: boolean;
  verifyResults?: boolean;
  deepVerification?: boolean;
  smartDetection?: boolean;
  confidenceThreshold?: number;
  checkFunctionality?: boolean;
}

export interface AnalysisResult {
  url: string;
  status: string;
  hasChatbot: boolean;
  chatSolutions?: string[];
  confidence?: number;
  verificationStatus?: 'verified' | 'unverified' | 'failed';
  matchedPatterns?: Record<string, number>;
  lastChecked: string;
}

export const analyzeWebsite = async (
  url: string, 
  html: string, 
  options: AnalysisOptions = {}
): Promise<AnalysisResult> => {
  const {
    debug = false,
    verifyResults = false,
    deepVerification = false,
    smartDetection = true,
    confidenceThreshold = 0.5,
    checkFunctionality = false
  } = options;
  
  try {
    if (debug) console.log(`Analyzing ${url} with options:`, options);
    
    // Check for known false positive domains first
    let domain = '';
    try {
      domain = new URL(url.startsWith('http') ? url : `https://${url}`).hostname;
    } catch (e) {
      console.error(`Invalid URL: ${url}`);
    }
    
    const isFalsePositiveDomain = FALSE_POSITIVE_DOMAINS.some(d => 
      domain.includes(d) || domain === d
    );
    
    if (isFalsePositiveDomain) {
      if (debug) console.log(`${url} is a known false positive domain`);
      return {
        url,
        status: 'No chatbot detected (known false positive site)',
        hasChatbot: false,
        chatSolutions: [],
        confidence: 0,
        verificationStatus: 'verified',
        lastChecked: new Date().toISOString()
      };
    }
    
    // Use enhanced smart detection if enabled
    if (smartDetection) {
      if (debug) console.log(`Using smart detection for ${url}`);
      
      const result = smartDetectChatbot(html, url);
      
      if (debug) {
        console.log(`Smart detection result for ${url}:`, {
          hasChatbot: result.hasChatbot,
          solutions: result.solutions,
          confidence: result.confidence,
          verificationStatus: result.verificationStatus
        });
      }
      
      // Apply confidence threshold
      const exceededThreshold = result.confidence >= (confidenceThreshold || 0.5);
      const hasChatbot = result.hasChatbot && exceededThreshold;
      
      return {
        url,
        status: hasChatbot ? 'Chatbot detected' : 'No chatbot detected',
        hasChatbot,
        chatSolutions: hasChatbot ? result.solutions : [],
        confidence: result.confidence,
        verificationStatus: result.verificationStatus,
        matchedPatterns: debug ? result.matchedPatterns : undefined,
        lastChecked: new Date().toISOString()
      };
    }
    
    // Legacy detection method if smartDetection is not enabled
    const matchedSolutions: string[] = [];
    
    // Check for each chat solution
    Object.entries(CHAT_PATTERNS).forEach(([solution, patterns]) => {
      const isMatch = patterns.some(pattern => pattern.test(html));
      if (isMatch) {
        matchedSolutions.push(solution);
      }
    });
    
    // Legacy verification methods
    const hasDynamicLoading = detectDynamicLoading(html);
    const hasChatElements = detectChatElements(html);
    const hasMetaTags = detectMetaTags(html);
    const hasWebSockets = detectWebSockets(html);
    
    // Determine if a chatbot exists with legacy verification
    let hasChatbot = matchedSolutions.length > 0;
    
    // Apply verification if requested
    if (verifyResults) {
      if (debug) console.log(`Applying verification for ${url}`);
      
      if (deepVerification) {
        // Require stronger evidence for detection
        hasChatbot = matchedSolutions.length > 0 && 
                    (hasDynamicLoading || hasChatElements) &&
                    (hasMetaTags || hasWebSockets);
      } else {
        // Basic verification
        hasChatbot = matchedSolutions.length > 0 && 
                    (hasDynamicLoading || hasChatElements || hasMetaTags || hasWebSockets);
      }
    }
    
    const status = hasChatbot ? 'Chatbot detected' : 'No chatbot detected';
    const chatSolutions = hasChatbot ? matchedSolutions : [];
    
    if (debug) {
      console.log(`Legacy detection result for ${url}:`, {
        hasChatbot,
        chatSolutions,
        dynamicLoading: hasDynamicLoading,
        chatElements: hasChatElements,
        metaTags: hasMetaTags,
        webSockets: hasWebSockets
      });
    }
    
    return {
      url,
      status,
      hasChatbot,
      chatSolutions,
      verificationStatus: hasChatbot ? 'verified' : 'unverified',
      lastChecked: new Date().toISOString()
    };
  } catch (error) {
    console.error(`Error analyzing ${url}:`, error);
    return {
      url,
      status: 'Error during analysis',
      hasChatbot: false,
      chatSolutions: [],
      verificationStatus: 'failed',
      lastChecked: new Date().toISOString()
    };
  }
};
