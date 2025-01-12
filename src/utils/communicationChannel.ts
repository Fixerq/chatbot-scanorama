// Message types
export const MESSAGE_TYPES = {
  UPDATE_ELEMENTS: 'UPDATE_SELECTED_ELEMENTS',
  TOGGLE_SELECTOR: 'TOGGLE_SELECTOR',
  ELEMENTS_UPDATED: 'ELEMENTS_UPDATED',
  SELECTOR_TOGGLED: 'SELECTOR_TOGGLED',
  ERROR: 'ERROR'
};

// Allowed origins
export const ALLOWED_ORIGINS = [
  'https://detectifys.engageai.pro',
  'https://detectify.engageai.pro',
  'http://localhost:8080',
  'http://localhost:3000',
  'https://gptengineer.app',
  'https://lovable.dev',
  'https://cdn.gpteng.co'
];

// Message interface
interface CommunicationMessage {
  type: string;
  data?: any;
  success?: boolean;
  error?: string;
}

// Declare the window interface extension
declare global {
  interface Window {
    sendMessage: (message: CommunicationMessage) => void;
  }
}

// Get current origin
function getCurrentOrigin(): string {
  return window.location.origin;
}

// Validate origin
function isValidOrigin(origin: string): boolean {
  return ALLOWED_ORIGINS.includes(origin);
}

// Handle element updates
function handleElementUpdate(data: any) {
  console.log('Handling element update:', data);
  const targetOrigin = getCurrentOrigin();
  if (window.parent && window.parent.postMessage && isValidOrigin(targetOrigin)) {
    window.parent.postMessage({
      type: MESSAGE_TYPES.ELEMENTS_UPDATED,
      success: true
    }, { targetOrigin });
  }
}

// Handle selector toggle
function handleSelectorToggle(data: any) {
  console.log('Handling selector toggle:', data);
  const targetOrigin = getCurrentOrigin();
  if (window.parent && window.parent.postMessage && isValidOrigin(targetOrigin)) {
    window.parent.postMessage({
      type: MESSAGE_TYPES.SELECTOR_TOGGLED,
      success: true
    }, { targetOrigin });
  }
}

// Initialize communication channel
export function initializeCommunication() {
  console.log('Initializing communication channel from origin:', getCurrentOrigin());
  
  // Handle incoming messages
  window.addEventListener('message', function(event) {
    try {
      // Check if origin is allowed
      if (!isValidOrigin(event.origin)) {
        console.warn('Message received from unauthorized origin:', event.origin);
        return;
      }

      const data = event.data as CommunicationMessage;
      console.log('Received message:', data);
      
      if (!data || !data.type) {
        console.warn('Invalid message format');
        return;
      }

      switch(data.type) {
        case MESSAGE_TYPES.UPDATE_ELEMENTS:
          handleElementUpdate(data);
          break;
        case MESSAGE_TYPES.TOGGLE_SELECTOR:
          handleSelectorToggle(data);
          break;
        default:
          console.log('Unhandled message type:', data.type);
      }
    } catch (error) {
      console.error('Error processing message:', error);
      const targetOrigin = event.origin;
      if (event.source && 'postMessage' in event.source && isValidOrigin(targetOrigin)) {
        (event.source as Window).postMessage({
          type: MESSAGE_TYPES.ERROR,
          error: (error as Error).message
        }, { targetOrigin });
      }
    }
  });

  // Helper function to send messages
  window.sendMessage = function(message: CommunicationMessage) {
    try {
      console.log('Sending message:', message);
      const targetOrigin = getCurrentOrigin();
      if (window.parent && window.parent.postMessage && isValidOrigin(targetOrigin)) {
        window.parent.postMessage(message, { targetOrigin });
      } else {
        console.warn('Invalid target origin or missing postMessage support');
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  console.log('Communication channel initialized');
}