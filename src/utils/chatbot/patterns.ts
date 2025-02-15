
import { supabase } from '@/integrations/supabase/client';
import { detectChatElements } from '../patternDetection';

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

    // Group matches by type
    const matchTypes = {
      dynamic: result.matches.some(m => m.type === 'dynamic'),
      elements: result.matches.some(m => m.type === 'element'),
      meta: result.matches.some(m => m.type === 'meta'),
      websockets: result.matches.some(m => m.type === 'websocket')
    };

    // Update pattern metrics in the database
    for (const match of result.matches) {
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
      matches: result.matches
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
