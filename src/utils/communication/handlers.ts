import { MessageType, MESSAGE_TYPES, isElementUpdateData, isSelectorToggleData } from './types';
import { sendMessageToParent } from './messaging';
import { CommunicationError } from './errors';

export async function handleElementUpdate(data: unknown): Promise<void> {
  if (!isElementUpdateData(data)) {
    console.error('Invalid element update data:', data);
    throw new CommunicationError('Invalid element update data format');
  }
  
  console.log('Handling element update:', data);
  await sendMessageToParent({
    type: MESSAGE_TYPES.ELEMENTS_UPDATED,
    success: true
  });
}

export async function handleSelectorToggle(data: unknown): Promise<void> {
  if (!isSelectorToggleData(data)) {
    console.error('Invalid selector toggle data:', data);
    throw new CommunicationError('Invalid selector toggle data format');
  }
  
  console.log('Handling selector toggle:', data);
  await sendMessageToParent({
    type: MESSAGE_TYPES.SELECTOR_TOGGLED,
    success: true
  });
}

export const messageHandlers: Record<MessageType, (data: unknown) => Promise<void>> = {
  [MESSAGE_TYPES.UPDATE_ELEMENTS]: handleElementUpdate,
  [MESSAGE_TYPES.TOGGLE_SELECTOR]: handleSelectorToggle,
  [MESSAGE_TYPES.ELEMENTS_UPDATED]: async () => {}, // No-op handler
  [MESSAGE_TYPES.SELECTOR_TOGGLED]: async () => {}, // No-op handler
  [MESSAGE_TYPES.ERROR]: async () => {} // No-op handler
};