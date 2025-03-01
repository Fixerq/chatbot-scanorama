
/**
 * Pattern detection utilities for chatbot analysis
 */

/**
 * Searches for specific patterns in the HTML content
 */
export function findPatternMatches(html: string, patterns: RegExp[]): string[] {
  if (!html || !patterns || patterns.length === 0) {
    return [];
  }
  
  // Convert HTML to lowercase for case-insensitive matching
  const lowerHtml = html.toLowerCase();
  
  // Find all matches
  const matches: string[] = [];
  
  for (const pattern of patterns) {
    const match = lowerHtml.match(pattern);
    if (match) {
      matches.push(match[0]);
    }
  }
  
  return matches;
}

/**
 * Detects chatbot solutions based on HTML content
 */
export function detectChatbotSolutions(html: string, patternMap: Record<string, RegExp[]>): string[] {
  if (!html) {
    return [];
  }
  
  const detectedSolutions: string[] = [];
  
  for (const [solution, patterns] of Object.entries(patternMap)) {
    const matches = findPatternMatches(html, patterns);
    if (matches.length > 0) {
      detectedSolutions.push(solution);
    }
  }
  
  return detectedSolutions;
}

/**
 * Calculate confidence score based on the number and strength of matches
 */
export function calculateConfidenceScore(matches: string[], totalPatterns: number): number {
  if (matches.length === 0 || totalPatterns === 0) {
    return 0;
  }
  
  // Calculate base score based on match ratio
  const baseScore = matches.length / Math.min(totalPatterns, 10);
  
  // Apply diminishing returns for more than 3 matches
  const diminishedScore = matches.length <= 3 
    ? baseScore 
    : 0.6 + (0.4 * (matches.length - 3) / 7);
  
  // Ensure score is between 0 and 1
  return Math.min(Math.max(diminishedScore, 0), 1);
}
