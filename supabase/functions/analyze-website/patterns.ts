
import { PLATFORM_PATTERNS } from './patterns/platformPatterns.ts';
import { MESSENGER_PATTERNS } from './patterns/messengerPatterns.ts';
import { SUPPORT_PATTERNS } from './patterns/supportPatterns.ts';
import { CUSTOM_PATTERNS } from './patterns/customPatterns.ts';

export const CHAT_PATTERNS = {
  ...PLATFORM_PATTERNS,
  ...MESSENGER_PATTERNS,
  ...SUPPORT_PATTERNS,
  ...CUSTOM_PATTERNS
};

