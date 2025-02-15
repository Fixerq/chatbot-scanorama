
import { basicChatPatterns } from './basicPatterns';
import { platformPatterns } from './platformPatterns';
import { elementPatterns } from './elementPatterns';
// Importing from the local module path instead of the Edge Function path
import { detectChatElements, detectDynamicLoading, detectMetaTags, detectWebSockets, getDetailedMatches } from '../../utils/patternDetection';

export const chatbotPatterns = [
  ...basicChatPatterns,
  ...Object.values(platformPatterns).flat(),
  ...Object.values(elementPatterns).flat(),
];

export interface ChatDetectionResult {
  hasChatbot: boolean;
  matchTypes: {
    dynamic: boolean;
    elements: boolean;
    meta: boolean;
    websockets: boolean;
  };
  matches: Array<{ type: string; pattern: string }>;
}

export const analyzeChatbotPresence = (html: string): ChatDetectionResult => {
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

  const dynamic = detectDynamicLoading(html);
  const elements = detectChatElements(html);
  const meta = detectMetaTags(html);
  const websockets = detectWebSockets(html);
  const detailedMatches = getDetailedMatches(html);

  return {
    hasChatbot: dynamic || elements || meta || websockets,
    matchTypes: {
      dynamic,
      elements,
      meta,
      websockets
    },
    matches: detailedMatches.map(match => ({
      type: match.type,
      pattern: match.pattern.toString()
    }))
  };
};

export const hasChatbotScript = (html: string): boolean => {
  if (!html) return false;
  
  const result = analyzeChatbotPresence(html);
  return result.hasChatbot;
};
