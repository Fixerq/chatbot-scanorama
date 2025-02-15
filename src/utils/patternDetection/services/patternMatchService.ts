
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
          void supabase.rpc('update_pattern_metrics', { 
            p_pattern: patternObj.pattern.toString(),
            p_matched: true 
          }).then(() => {
            // Successful update
          }).catch(err => {
            console.error('[PatternDetection] Error updating pattern metrics:', err);
          });

          return {
            type: patternObj.type,
            pattern: patternObj.pattern.toString(),
            matched: match[0],
            confidence: patternObj.confidence,
            category: patternObj.category,
            subcategory: patternObj.subcategory
          } satisfies PatternMatchResult;
        }

        // Update pattern metrics for unsuccessful match
        void supabase.rpc('update_pattern_metrics', { 
          p_pattern: patternObj.pattern.toString(),
          p_matched: false
        }).then(() => {
          // Successful update
        }).catch(err => {
          console.error('[PatternDetection] Error updating pattern metrics:', err);
        });

        return null;
      } catch (error) {
        console.error('[PatternDetection] Error testing pattern:', {
          pattern: patternObj.pattern.toString(),
          error: error instanceof Error ? error.message : 'Unknown error'
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
