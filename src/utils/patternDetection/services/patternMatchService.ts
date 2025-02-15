
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
        const pattern = patternObj.pattern.toString();

        void supabase.rpc('update_pattern_metrics', { 
          p_pattern: pattern,
          p_matched: Boolean(match)
        });

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

          return {
            type: patternObj.type,
            pattern: pattern,
            matched: match[0],
            confidence: patternObj.confidence,
            category: patternObj.category,
            subcategory: patternObj.subcategory
          } as PatternMatchResult;
        }

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
