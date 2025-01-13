// Message types
export const MESSAGE_TYPES = {
  UPDATE_ELEMENTS: 'UPDATE_SELECTED_ELEMENTS',
  TOGGLE_SELECTOR: 'TOGGLE_SELECTOR',
  ELEMENTS_UPDATED: 'ELEMENTS_UPDATED',
  SELECTOR_TOGGLED: 'SELECTOR_TOGGLED',
  ERROR: 'ERROR'
};

// Allowed origins - primary origin should be first
export const ALLOWED_ORIGINS = [
  'https://detectify.engageai.pro',
  'https://detectifys.engageai.pro',
  'https://gptengineer.app',
  'http://localhost:3000',
  'https://lovable.dev'
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

// Get primary origin (first in ALLOWED_ORIGINS)
function getPrimaryOrigin(): string {
  return ALLOWED_ORIGINS[0];
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
  const targetOrigin = getPrimaryOrigin();
  if (window.parent && window.parent.postMessage) {
    window.parent.postMessage({
      type: MESSAGE_TYPES.ELEMENTS_UPDATED,
      success: true
    }, targetOrigin);
  }
}

// Handle selector toggle
function handleSelectorToggle(data: any) {
  console.log('Handling selector toggle:', data);
  const targetOrigin = getPrimaryOrigin();
  if (window.parent && window.parent.postMessage) {
    window.parent.postMessage({
      type: MESSAGE_TYPES.SELECTOR_TOGGLED,
      success: true
    }, targetOrigin);
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
      const targetOrigin = getPrimaryOrigin();
      if (event.source && 'postMessage' in event.source) {
        (event.source as Window).postMessage({
          type: MESSAGE_TYPES.ERROR,
          error: (error as Error).message
        }, targetOrigin);
      }
    }
  });

  // Helper function to send messages
  window.sendMessage = function(message: CommunicationMessage) {
    try {
      console.log('Sending message:', message);
      const targetOrigin = getPrimaryOrigin();
      if (window.parent && window.parent.postMessage) {
        window.parent.postMessage(message, targetOrigin);
      } else {
        console.warn('Missing postMessage support');
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  console.log('Communication channel initialized');
}