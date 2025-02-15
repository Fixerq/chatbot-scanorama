
import { PatternMatch, PatternMatchResult } from '../types';
import { getDetailedMatches } from './patternMatchService';

export async function detectChatElements(html: string): Promise<{
  hasChat: boolean;
  matches: PatternMatchResult[];
}> {
  const matches = await getDetailedMatches(html);
  // Consider a match valid if it has a confidence score above 0.7
  const validMatches = matches.filter(match => !match.confidence || match.confidence >= 0.7);
  return {
    hasChat: validMatches.length > 0,
    matches: validMatches
  };
}
