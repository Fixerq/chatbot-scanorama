export class CommunicationError extends Error {
  constructor(
    message: string, 
    public readonly code?: string,
    public readonly timestamp: string = new Date().toISOString()
  ) {
    super(message);
    this.name = 'CommunicationError';
  }
}