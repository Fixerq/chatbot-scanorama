
import { PLATFORM_PATTERNS } from './patterns/platformPatterns';
import { MESSENGER_PATTERNS } from './patterns/messengerPatterns';
import { SUPPORT_PATTERNS } from './patterns/supportPatterns';
import { CUSTOM_PATTERNS } from './patterns/customPatterns';

export const CHAT_PATTERNS = {
  ...PLATFORM_PATTERNS,
  ...MESSENGER_PATTERNS,
  ...SUPPORT_PATTERNS,
  ...CUSTOM_PATTERNS
};
