
import { PatternMatchResult } from '../types.ts';

/**
 * Detects chatbot solutions based on HTML patterns
 */
export function detectChatbotSolutions(
  html: string,
  patterns: Record<string, RegExp[]>
): string[] {
  if (!html || typeof html !== 'string') {
    return [];
  }

  const solutions: string[] = [];
  
  // Check each solution's patterns against the HTML
  for (const [solution, solutionPatterns] of Object.entries(patterns)) {
    const matchesPattern = solutionPatterns.some(pattern => pattern.test(html));
    
    if (matchesPattern) {
      solutions.push(solution);
    }
  }
  
  return solutions;
}

/**
 * Performs detailed pattern matching and returns matches with confidence
 */
export function analyzePatternMatches(
  html: string,
  patterns: Record<string, RegExp[]>
): PatternMatchResult {
  if (!html || typeof html !== 'string') {
    return {
      matches: [],
      matchedPatterns: {},
      confidence: 0
    };
  }
  
  const matches: string[] = [];
  const matchedPatterns: Record<string, string[]> = {};
  
  // Track total pattern count for confidence calculation
  let totalPatterns = 0;
  let matchedPatternCount = 0;
  
  // Check each solution's patterns against the HTML
  for (const [solution, solutionPatterns] of Object.entries(patterns)) {
    const solutionMatches: string[] = [];
    
    totalPatterns += solutionPatterns.length;
    
    // Test each pattern
    for (const pattern of solutionPatterns) {
      if (pattern.test(html)) {
        // Extract the actual match for inspection
        const matchText = html.match(pattern)?.[0] || '';
        if (matchText) {
          solutionMatches.push(matchText);
          matchedPatternCount++;
        }
      }
    }
    
    // If we found matches for this solution
    if (solutionMatches.length > 0) {
      matches.push(solution);
      matchedPatterns[solution] = solutionMatches;
    }
  }
  
  // Calculate confidence based on the ratio of matching patterns
  const confidence = calculateConfidenceScore(matches, totalPatterns);
  
  return {
    matches,
    matchedPatterns,
    confidence
  };
}

/**
 * Calculates a confidence score based on the number of matching patterns
 */
export function calculateConfidenceScore(
  matches: string[],
  totalPatterns: number
): number {
  if (matches.length === 0 || totalPatterns === 0) {
    return 0;
  }
  
  // Weight based on number of matching solutions
  const solutionWeight = Math.min(matches.length / 3, 1); // Cap at 1
  
  // Base confidence starting at 0.6
  const baseConfidence = 0.6;
  
  // Adjust confidence based on solution count
  return baseConfidence + (0.4 * solutionWeight);
}
