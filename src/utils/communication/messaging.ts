import { CommunicationMessage } from './types';
import { originUtils } from './config';
import { CommunicationError } from './errors';

export function sendMessageToParent(message: CommunicationMessage): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      const targetOrigin = originUtils.getPrimary();
      console.log('Sending message to parent:', { message, targetOrigin });
      
      if (!window.parent || !window.parent.postMessage) {
        throw new CommunicationError('Missing postMessage support');
      }
      
      window.parent.postMessage(message, targetOrigin);
      console.log('Message sent successfully to:', targetOrigin);
      resolve();
    } catch (error) {
      console.error('Error sending message to parent:', error);
      reject(error);
    }
  });
}