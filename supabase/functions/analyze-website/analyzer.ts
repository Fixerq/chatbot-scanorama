
import { fetchHtmlContent } from './utils/httpUtils.ts';
import { normalizeUrl, sanitizeUrl, isValidUrl } from './utils/urlUtils.ts';
import { CHATBOT_PATTERNS, TOTAL_PATTERNS, CHAT_INVITATION_PATTERNS } from './patterns.ts';
import { detectChatbotSolutions, calculateConfidenceScore } from './utils/patternDetection.ts';
import { performSmartDetection, isFalsePositive } from './utils/smartDetection.ts';
import { getCachedResult, cacheResult } from './cache.ts';
import { AnalysisResult, AnalysisOptions } from './types.ts';

/**
 * Analyzes a website to detect the presence of chatbots
 */
export async function analyzeWebsite(
  url: string, 
  html?: string, 
  options: AnalysisOptions = {}
): Promise<AnalysisResult> {
  // Default options
  const {
    debug = false,
    verifyResults = true,
    deepVerification = false,
    smartDetection = true,
    confidenceThreshold = 0.3,
    checkFunctionality = false,
    timeout = 30000,
    detectHiddenChatbots = false,
    ignoreVisibilityChecks = false,
    suggestedProviders = []
  } = options;

  // Validate and normalize URL
  if (!url || !isValidUrl(url)) {
    return {
      url,
      status: 'Error: Invalid URL',
      hasChatbot: false,
      chatSolutions: [],
      lastChecked: new Date().toISOString()
    };
  }

  try {
    // Normalize and sanitize the URL
    const formattedUrl = sanitizeUrl(normalizeUrl(url));
    
    // Skip cache if we're using suggested providers or in debug mode
    const useCachedResult = !debug && suggestedProviders.length === 0;
    
    // Check cache first if appropriate
    if (useCachedResult) {
      const cachedResult = getCachedResult(formattedUrl);
      if (cachedResult) {
        if (debug) console.log(`Returning cached result for ${formattedUrl}`);
        return {
          ...cachedResult,
          status: 'Cached',
        };
      }
    }

    // Fetch the HTML content if not provided
    let htmlContent = html;
    if (!htmlContent) {
      if (debug) console.log(`Fetching HTML content for ${formattedUrl}`);
      htmlContent = await fetchHtmlContent(formattedUrl, { timeout });
    }

    // Check for false positives
    if (isFalsePositive(formattedUrl, htmlContent)) {
      const result = {
        url: formattedUrl,
        status: 'No chatbot detected (filtered)',
        hasChatbot: false,
        chatSolutions: [],
        confidence: 0,
        verificationStatus: 'verified' as const,
        lastChecked: new Date().toISOString()
      };
      cacheResult(formattedUrl, result);
      return result;
    }

    // If we have suggested providers, prioritize their patterns
    let patternsToUse = CHATBOT_PATTERNS;
    if (suggestedProviders && suggestedProviders.length > 0) {
      if (debug) console.log(`Using suggested providers: ${suggestedProviders.join(', ')}`);
      
      // Create a filtered patterns object with only the suggested providers
      const filteredPatterns: Record<string, RegExp[]> = {};
      
      for (const provider of suggestedProviders) {
        if (CHATBOT_PATTERNS[provider]) {
          filteredPatterns[provider] = CHATBOT_PATTERNS[provider];
        }
      }
      
      // Always include generic patterns
      if (CHATBOT_PATTERNS['Website Chatbot']) {
        filteredPatterns['Website Chatbot'] = CHATBOT_PATTERNS['Website Chatbot'];
      }
      
      // If we have filtered patterns, use them, otherwise fallback to all patterns
      if (Object.keys(filteredPatterns).length > 0) {
        patternsToUse = filteredPatterns;
      }
    }

    // Detect chatbot solutions using pattern matching - more aggressive
    const detectedSolutions = detectChatbotSolutions(htmlContent, patternsToUse);
    
    // Check for chat invitation patterns - stronger signal
    const invitationMatches = CHAT_INVITATION_PATTERNS.some(pattern => 
      pattern.test(htmlContent)
    );

    // Use smart detection for additional insights - give this more weight
    let smartDetectionResult = { isLikelyChatbot: false, confidence: 0, indicators: [] };
    if (smartDetection) {
      smartDetectionResult = performSmartDetection(htmlContent);
      if (debug) {
        console.log('Smart detection results:', smartDetectionResult);
      }
    }

    // Combine results to determine final chatbot status
    const patternBasedConfidence = detectedSolutions.length > 0 
      ? calculateConfidenceScore(detectedSolutions, TOTAL_PATTERNS)
      : 0;
    
    // More aggressive weighted combination - give more weight to pattern matching
    const combinedConfidence = detectedSolutions.length > 0
      ? 0.8 * patternBasedConfidence + 0.2 * smartDetectionResult.confidence
      : smartDetectionResult.confidence * 1.25; // Boost smart detection confidence
    
    // Adjust threshold based on stage options
    const effectiveThreshold = suggestedProviders.length > 0 
      ? Math.max(0.4, confidenceThreshold) // Higher threshold for subsequent stages
      : confidenceThreshold; // Use provided threshold for initial stage
    
    // More relaxed threshold for determining if a chatbot is present
    const hasChatbot = combinedConfidence >= effectiveThreshold || 
      (detectedSolutions.length > 0 && invitationMatches) ||
      (detectedSolutions.length >= 3); // If we have at least 3 pattern matches, be more confident
    
    // Consolidate solutions (remove duplicates and normalize)
    let chatSolutions = [...new Set(detectedSolutions)];
    
    // If no specific solution was detected but smart detection found a chatbot,
    // add a generic "Website Chatbot" solution more aggressively
    if ((chatSolutions.length === 0 && hasChatbot) || 
        (smartDetectionResult.confidence > 0.4 && smartDetectionResult.indicators.length >= 3)) {
      chatSolutions = ['Website Chatbot'];
    }

    // Prepare the result with more emphasis on any positive signal
    const result: AnalysisResult = {
      url: formattedUrl,
      status: hasChatbot ? 'Chatbot detected' : 'No chatbot detected',
      hasChatbot,
      chatSolutions,
      confidence: combinedConfidence,
      verificationStatus: verifyResults ? 'verified' : 'unverified',
      indicators: smartDetectionResult.indicators,
      lastChecked: new Date().toISOString()
    };

    // Cache the result
    cacheResult(formattedUrl, result);
    
    return result;
  } catch (error) {
    console.error(`Error analyzing ${url}:`, error);
    
    return {
      url,
      status: 'Error analyzing website',
      hasChatbot: false,
      chatSolutions: [],
      error: error instanceof Error ? error.message : String(error),
      lastChecked: new Date().toISOString()
    };
  }
}

/**
 * Analyzes multiple websites in batch
 */
export async function analyzeBatch(
  urls: string[], 
  options: AnalysisOptions = {}
): Promise<AnalysisResult[]> {
  if (!urls || urls.length === 0) {
    return [];
  }

  // Process URLs in parallel with a limit
  const results: AnalysisResult[] = [];
  
  for (const url of urls) {
    try {
      const result = await analyzeWebsite(url, undefined, options);
      results.push(result);
    } catch (error) {
      console.error(`Error in batch analysis for ${url}:`, error);
      results.push({
        url,
        status: 'Error in batch processing',
        hasChatbot: false,
        chatSolutions: [],
        error: error instanceof Error ? error.message : String(error),
        lastChecked: new Date().toISOString()
      });
    }
  }

  return results;
}
