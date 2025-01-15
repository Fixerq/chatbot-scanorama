import { CommunicationMessage, MESSAGE_TYPES } from './communication/types';
import { originUtils } from './communication/config';
import { CommunicationError } from './communication/errors';
import { messageHandlers } from './communication/handlers';
import { sendMessageToParent } from './communication/messaging';

// Window interface extension
declare global {
  interface Window {
    sendMessage: (message: CommunicationMessage) => Promise<void>;
  }
}

export function initializeCommunication(): void {
  console.log('Initializing communication channel from origin:', originUtils.getCurrent());
  
  window.addEventListener('message', async function(event: MessageEvent) {
    try {
      if (!originUtils.isValid(event.origin)) {
        console.warn('Message received from unauthorized origin:', event.origin);
        return;
      }

      if (!event.source || !(event.source instanceof Window)) {
        throw new CommunicationError('Invalid message source');
      }

      const message = event.data as CommunicationMessage;
      
      if (!message?.type || !(message.type in MESSAGE_TYPES)) {
        throw new CommunicationError('Invalid message format', 'FORMAT_ERROR');
      }

      console.log('Received message:', { type: message.type, origin: event.origin });
      
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

  window.sendMessage = sendMessageToParent;

  console.log('Communication channel initialized');
}