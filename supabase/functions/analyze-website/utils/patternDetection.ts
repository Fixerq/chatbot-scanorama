
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
    // Count how many patterns match for this solution
    let matchCount = 0;
    for (const pattern of solutionPatterns) {
      if (pattern.test(html)) {
        matchCount++;
      }
    }
    
    // If we have even one match, consider it a potential solution
    // For "Website Chatbot", require more matches since it's generic
    const isGeneric = solution === 'Website Chatbot';
    const requiredMatches = isGeneric ? 2 : 1;
    
    if (matchCount >= requiredMatches) {
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
      // For generic solutions, require more evidence
      const isGeneric = solution === 'Website Chatbot' || solution === 'ChatBot';
      const requiredMatches = isGeneric ? 2 : 1;
      
      if (solutionMatches.length >= requiredMatches) {
        matches.push(solution);
        matchedPatterns[solution] = solutionMatches;
      }
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
 * More aggressive with scoring to improve detection
 */
export function calculateConfidenceScore(
  matches: string[],
  totalPatterns: number
): number {
  if (matches.length === 0 || totalPatterns === 0) {
    return 0;
  }
  
  // Weight based on number of matching solutions - more aggressive
  const solutionWeight = Math.min(matches.length / 2, 1); // Cap at 1, but easier to reach
  
  // Base confidence starting at 0.65 - higher baseline
  const baseConfidence = 0.65;
  
  // Adjust confidence based on solution count
  const finalConfidence = baseConfidence + (0.35 * solutionWeight);
  
  // Provide a boost for known commercial solutions vs generic detections
  const hasCommercialSolution = matches.some(solution => 
    solution !== 'Website Chatbot' && solution !== 'ChatBot'
  );
  
  // Apply a confidence boost for commercial solutions
  return hasCommercialSolution ? Math.min(finalConfidence * 1.1, 1) : finalConfidence;
}
