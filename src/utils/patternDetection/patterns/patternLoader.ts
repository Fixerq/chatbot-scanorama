
import { supabase } from '@/integrations/supabase/client';
import { PatternMatch } from '../types';

export async function loadPatterns(): Promise<PatternMatch[]> {
  try {
    const { data: patterns, error } = await supabase
      .from('chatbot_detection_patterns')
      .select('*')
      .eq('enabled', true)
      .order('confidence_score', { ascending: false });

    if (error) {
      console.error('[PatternLoader] Error loading patterns:', error);
      return [];
    }

    return patterns.map(pattern => ({
      pattern: new RegExp(pattern.pattern_value, 'i'),
      type: pattern.pattern_type as PatternMatch['type'],
      confidence: pattern.confidence_score,
      category: pattern.category,
      subcategory: pattern.subcategory
    }));
  } catch (error) {
    console.error('[PatternLoader] Error processing patterns:', error);
    return [];
  }
}

