
import { supabase } from '@/integrations/supabase/client';
import { detectChatElements } from '../patternDetection';
import { PatternMatchResult } from '../patternDetection/types';

export interface ChatDetectionResult {
  hasChatbot: boolean;
  matchTypes: {
    dynamic: boolean;
    elements: boolean;
    meta: boolean;
    websockets: boolean;
  };
  matches: Array<{ 
    type: string; 
    pattern: string;
    matched?: string;
    confidence?: number;
    category?: string;
    subcategory?: string;
  }>;
}

export const analyzeChatbotPresence = async (html: string): Promise<ChatDetectionResult> => {
  if (!html) {
    return {
      hasChatbot: false,
      matchTypes: {
        dynamic: false,
        elements: false,
        meta: false,
        websockets: false
      },
      matches: []
    };
  }

  try {
    const result = await detectChatElements(html);
    const matches = result.matches || [];

    // Group matches by type
    const matchTypes = {
      dynamic: matches.some(m => m.type === 'dynamic'),
      elements: matches.some(m => m.type === 'element'),
      meta: matches.some(m => m.type === 'meta'),
      websockets: matches.some(m => m.type === 'websocket')
    };

    // Update pattern metrics in the database
    for (const match of matches) {
      if (!match.pattern) continue;

      void supabase
        .rpc('update_pattern_metrics', { 
          p_pattern: match.pattern,
          p_matched: Boolean(match.matched)
        });
    }

    return {
      hasChatbot: result.hasChat,
      matchTypes,
      matches
    };

  } catch (error) {
    console.error('[ChatbotPatterns] Error analyzing chatbot presence:', error);
    return {
      hasChatbot: false,
      matchTypes: {
        dynamic: false,
        elements: false,
        meta: false,
        websockets: false
      },
      matches: []
    };
  }
};

export const hasChatbotScript = async (html: string): Promise<boolean> => {
  if (!html) return false;
  
  const result = await analyzeChatbotPresence(html);
  return result.hasChatbot;
};
