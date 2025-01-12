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

// Declare the window interface extension
declare global {
  interface Window {
    sendMessage: (message: any) => void;
  }
}

// Handle element updates
function handleElementUpdate(data: any) {
  console.log('Handling element update:', data);
  if (window.parent && window.parent.postMessage) {
    window.parent.postMessage({
      type: MESSAGE_TYPES.ELEMENTS_UPDATED,
      success: true
    }, { targetOrigin: '*' });
  }
}

// Handle selector toggle
function handleSelectorToggle(data: any) {
  console.log('Handling selector toggle:', data);
  if (window.parent && window.parent.postMessage) {
    window.parent.postMessage({
      type: MESSAGE_TYPES.SELECTOR_TOGGLED,
      success: true
    }, { targetOrigin: '*' });
  }
}

// Initialize communication channel
export function initializeCommunication() {
  // Handle incoming messages
  window.addEventListener('message', function(event) {
    try {
      // Check if origin is allowed
      if (!ALLOWED_ORIGINS.includes(event.origin)) {
        console.warn('Message received from unauthorized origin:', event.origin);
        return;
      }

      const data = event.data;
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
      if (event.source && 'postMessage' in event.source) {
        event.source.postMessage({
          type: MESSAGE_TYPES.ERROR,
          error: (error as Error).message
        }, { targetOrigin: event.origin });
      }
    }
  });

  // Helper function to send messages
  window.sendMessage = function(message: any) {
    try {
      console.log('Sending message:', message);
      if (window.parent && window.parent.postMessage) {
        window.parent.postMessage(message, { targetOrigin: '*' });
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  console.log('Communication channel initialized');
}