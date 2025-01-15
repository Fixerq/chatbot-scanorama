// Message types as string literals for better type safety
export const MESSAGE_TYPES = {
  UPDATE_ELEMENTS: 'UPDATE_SELECTED_ELEMENTS',
  TOGGLE_SELECTOR: 'TOGGLE_SELECTOR',
  ELEMENTS_UPDATED: 'ELEMENTS_UPDATED',
  SELECTOR_TOGGLED: 'SELECTOR_TOGGLED',
  ERROR: 'ERROR'
} as const;

export type MessageType = typeof MESSAGE_TYPES[keyof typeof MESSAGE_TYPES];

export interface ElementUpdateData {
  elements: any[];
  selector?: string;
  timestamp: number;
}

export interface SelectorToggleData {
  selector: string;
  active: boolean;
  timestamp: number;
}

export type MessageData = ElementUpdateData | SelectorToggleData;

export interface CommunicationMessage {
  type: MessageType;
  data?: MessageData;
  success?: boolean;
  error?: string;
}

// Type guards
export function isElementUpdateData(data: any): data is ElementUpdateData {
  return Array.isArray(data?.elements) && typeof data?.timestamp === 'number';
}

export function isSelectorToggleData(data: any): data is SelectorToggleData {
  return typeof data?.selector === 'string' && 
         typeof data?.active === 'boolean' && 
         typeof data?.timestamp === 'number';
}