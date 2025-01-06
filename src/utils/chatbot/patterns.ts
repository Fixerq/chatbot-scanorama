import { basicChatPatterns } from './basicPatterns';
import { platformPatterns } from './platformPatterns';
import { elementPatterns } from './elementPatterns';

export const chatbotPatterns = [
  ...basicChatPatterns,
  ...Object.values(platformPatterns).flat(),
  ...Object.values(elementPatterns).flat(),
];

export const hasChatbotScript = (html: string): boolean => {
  if (!html) return false;

  // First check for common chat elements in the HTML structure
  const hasCommonChatElements = /<div[^>]*(?:chat|messenger|support)[^>]*>/.test(html) ||
    /<iframe[^>]*(?:chat|messenger|support)[^>]*>/.test(html) ||
    /<button[^>]*(?:chat|messenger|support)[^>]*>/.test(html);

  // Check for chat-related scripts and links
  const hasScriptOrLink = /<(?:script|link)[^>]*(?:chat|messenger|support)[^>]*>/.test(html);

  // Check for specific chat platform patterns
  const hasChatPlatform = Object.entries(platformPatterns).some(([_, patterns]) => 
    patterns.some(pattern => pattern.test(html))
  );

  // Check for dynamic loading patterns
  const hasDynamicLoading = elementPatterns.scripts.some(pattern => pattern.test(html));

  // Check for common chat-related meta tags
  const hasMetaTags = /<meta[^>]*(?:chat|messenger|support)[^>]*>/.test(html);

  // Check for chat-related data attributes
  const hasDataAttributes = /data-(?:chat|messenger|support|widget)/i.test(html);

  // Check for chat-related comments
  const hasComments = /<!--.*(?:chat|messenger|support).*-->/i.test(html);

  // Check for chat-related JSON configuration
  const hasJsonConfig = /{[^}]*(?:chat|messenger|support)[^}]*}/i.test(html);

  // Return true if any of the checks pass
  return hasCommonChatElements || 
         hasScriptOrLink || 
         hasChatPlatform || 
         hasDynamicLoading || 
         hasMetaTags ||
         hasDataAttributes ||
         hasComments ||
         hasJsonConfig;
};