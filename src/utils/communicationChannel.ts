// Message types as string literals for better type safety
export const MESSAGE_TYPES = {
  UPDATE_ELEMENTS: 'UPDATE_SELECTED_ELEMENTS',
  TOGGLE_SELECTOR: 'TOGGLE_SELECTOR',
  ELEMENTS_UPDATED: 'ELEMENTS_UPDATED',
  SELECTOR_TOGGLED: 'SELECTOR_TOGGLED',
  ERROR: 'ERROR'
} as const;

// Create a type from message type values
type MessageType = typeof MESSAGE_TYPES[keyof typeof MESSAGE_TYPES];

// Specific data interfaces with required fields
interface ElementUpdateData {
  elements: any[]; // Made required
  selector?: string;
  timestamp: number; // Made required
}

interface SelectorToggleData {
  selector: string; // Made required
  active: boolean; // Made required
  timestamp: number; // Made required
}

// Union type for all possible data types
type MessageData = ElementUpdateData | SelectorToggleData;

// Improved message interface with specific types
interface CommunicationMessage {
  type: MessageType;
  data?: MessageData;
  success?: boolean;
  error?: string;
}

// Type guard functions
function isElementUpdateData(data: any): data is ElementUpdateData {
  return Array.isArray(data?.elements) && typeof data?.timestamp === 'number';
}

function isSelectorToggleData(data: any): data is SelectorToggleData {
  return typeof data?.selector === 'string' && 
         typeof data?.active === 'boolean' && 
         typeof data?.timestamp === 'number';
}

// Window interface extension
declare global {
  interface Window {
    sendMessage: (message: CommunicationMessage) => Promise<void>;
  }
}

// Allowed origins configuration
export const ALLOWED_ORIGINS = [
  'https://detectify.engageai.pro',
  'https://detectifys.engageai.pro',
  'https://gptengineer.app',
  'http://localhost:3000',
  'https://lovable.dev'
] as const;

// Origin management
const originUtils = {
  getPrimary: (): string => ALLOWED_ORIGINS[0],
  getCurrent: (): string => window.location.origin,
  isValid: (origin: string): boolean => ALLOWED_ORIGINS.includes(origin as any)
};

// Custom error class
class CommunicationError extends Error {
  constructor(message: string, public readonly code?: string) {
    super(message);
    this.name = 'CommunicationError';
  }
}

// Message handlers with proper type checking
async function handleElementUpdate(data: unknown): Promise<void> {
  if (!isElementUpdateData(data)) {
    throw new CommunicationError('Invalid element update data format');
  }
  
  console.log('Handling element update:', data);
  await sendMessageToParent({
    type: MESSAGE_TYPES.ELEMENTS_UPDATED,
    success: true
  });
}

async function handleSelectorToggle(data: unknown): Promise<void> {
  if (!isSelectorToggleData(data)) {
    throw new CommunicationError('Invalid selector toggle data format');
  }
  
  console.log('Handling selector toggle:', data);
  await sendMessageToParent({
    type: MESSAGE_TYPES.SELECTOR_TOGGLED,
    success: true
  });
}

// Helper function for sending messages to parent
function sendMessageToParent(message: CommunicationMessage): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      const targetOrigin = originUtils.getPrimary();
      if (!window.parent || !window.parent.postMessage) {
        throw new CommunicationError('Missing postMessage support');
      }
      window.parent.postMessage(message, targetOrigin);
      resolve();
    } catch (error) {
      reject(error);
    }
  });
}

// Message handler map with proper typing
const messageHandlers: Record<MessageType, (data: unknown) => Promise<void>> = {
  [MESSAGE_TYPES.UPDATE_ELEMENTS]: handleElementUpdate,
  [MESSAGE_TYPES.TOGGLE_SELECTOR]: handleSelectorToggle,
  [MESSAGE_TYPES.ELEMENTS_UPDATED]: async () => {}, // No-op handler
  [MESSAGE_TYPES.SELECTOR_TOGGLED]: async () => {}, // No-op handler
  [MESSAGE_TYPES.ERROR]: async () => {} // No-op handler
};

// Initialize communication channel
export function initializeCommunication(): void {
  console.log('Initializing communication channel from origin:', originUtils.getCurrent());
  
  // Handle incoming messages
  window.addEventListener('message', async function(event: MessageEvent) {
    try {
      // Validate origin and source
      if (!originUtils.isValid(event.origin)) {
        console.warn('Message received from unauthorized origin:', event.origin);
        return;
      }

      if (!event.source || !(event.source instanceof Window)) {
        throw new CommunicationError('Invalid message source');
      }

      const message = event.data as CommunicationMessage;
      
      // Validate message format
      if (!message?.type || !(message.type in MESSAGE_TYPES)) {
        throw new CommunicationError('Invalid message format');
      }

      console.log('Received message:', message);
      
      // Handle message
      const handler = messageHandlers[message.type];
      await handler(message.data);
      
    } catch (error) {
      console.error('Error processing message:', error);
      
      if (event.source && event.source instanceof Window) {
        try {
          await sendMessageToParent({
            type: MESSAGE_TYPES.ERROR,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        } catch (sendError) {
          console.error('Failed to send error message:', sendError);
        }
      }
    }
  });

  // Expose message sending function
  window.sendMessage = sendMessageToParent;

  console.log('Communication channel initialized');
}