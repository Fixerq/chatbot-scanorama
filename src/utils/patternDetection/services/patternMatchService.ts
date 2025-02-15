
import { PatternMatch, PatternMatchResult } from '../types';
import { logPatternMatch } from '../utils/logger';
import { loadPatterns } from '../patterns/patternLoader';
import { supabase } from '@/integrations/supabase/client';

let patternsCache: PatternMatch[] | null = null;
let lastPatternLoad = 0;
const PATTERN_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function ensurePatternsLoaded(): Promise<PatternMatch[]> {
  const now = Date.now();
  if (!patternsCache || now - lastPatternLoad > PATTERN_CACHE_TTL) {
    patternsCache = await loadPatterns();
    lastPatternLoad = now;
  }
  return patternsCache;
}

export async function getDetailedMatches(html: string): Promise<PatternMatchResult[]> {
  try {
    console.log('[PatternDetection] Starting detailed pattern matching');
    const patterns = await ensurePatternsLoaded();

    const matches = patterns.map(patternObj => {
      try {
        const match = html.match(patternObj.pattern);
        if (match) {
          logPatternMatch(
            patternObj.type,
            patternObj.pattern,
            match[0],
            {
              confidence: patternObj.confidence,
              category: patternObj.category,
              subcategory: patternObj.subcategory
            }
          );

          // Update pattern metrics for successful match
          supabase.rpc('update_pattern_metrics', { 
            p_pattern: patternObj.pattern.toString(),
            p_matched: true 
          }).catch(err => {
            console.error('[PatternDetection] Error updating pattern metrics:', err);
          });

          return {
            ...patternObj,
            matched: match[0],
            pattern: patternObj.pattern.toString()
          };
        }

        // Update pattern metrics for unsuccessful match
        supabase.rpc('update_pattern_metrics', { 
          p_pattern: patternObj.pattern.toString(),
          p_matched: false
        }).catch(err => {
          console.error('[PatternDetection] Error updating pattern metrics:', err);
        });

        return null;
      } catch (error) {
        console.error('[PatternDetection] Error testing pattern:', {
          pattern: patternObj.pattern.toString(),
          error: error.message
        });
        return null;
      }
    }).filter((match): match is PatternMatchResult => match !== null);

    console.log('[PatternDetection] Detailed pattern matching complete. Found matches:', matches.length);
    return matches;
  } catch (error) {
    console.error('[PatternDetection] Error in getDetailedMatches:', error);
    return [];
  }
}

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
