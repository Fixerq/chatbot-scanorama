
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
    confidenceThreshold = 0.5,
    checkFunctionality = false,
    timeout = 30000
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
    
    // Check cache first
    const cachedResult = getCachedResult(formattedUrl);
    if (cachedResult && !debug) {
      if (debug) console.log(`Returning cached result for ${formattedUrl}`);
      return {
        ...cachedResult,
        status: 'Cached',
      };
    }

    // Fetch the HTML content if not provided
    let htmlContent = html;
    if (!htmlContent) {
      if (debug) console.log(`Fetching HTML content for ${formattedUrl}`);
      htmlContent = await fetchHtmlContent(formattedUrl);
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

    // Detect chatbot solutions using pattern matching
    const detectedSolutions = detectChatbotSolutions(htmlContent, CHATBOT_PATTERNS);
    
    // Check for chat invitation patterns
    const invitationMatches = CHAT_INVITATION_PATTERNS.some(pattern => 
      pattern.test(htmlContent)
    );

    // Use smart detection for additional insights
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
    
    // Weighted combination of pattern matching and smart detection
    const combinedConfidence = detectedSolutions.length > 0
      ? 0.7 * patternBasedConfidence + 0.3 * smartDetectionResult.confidence
      : smartDetectionResult.confidence;
    
    // Determine if a chatbot is present based on confidence threshold
    const hasChatbot = combinedConfidence >= confidenceThreshold || 
      (detectedSolutions.length > 0 && invitationMatches);

    // Consolidate solutions (remove duplicates and normalize)
    let chatSolutions = [...new Set(detectedSolutions)];
    
    // If no specific solution was detected but smart detection found a chatbot,
    // add a generic "Website Chatbot" solution
    if (chatSolutions.length === 0 && hasChatbot) {
      chatSolutions = ['Website Chatbot'];
    }

    // Prepare the result
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
