// Simple API key service for managing search API keys
export class ApiKeyService {
  private static API_KEY = 'backend-configured';

  static getApiKey(): string {
    return this.API_KEY;
  }

  static saveApiKey(apiKey: string): void {
    // For now, we rely on backend configuration
    // Future enhancement: could save to localStorage if needed
    console.log('API key will be managed by backend configuration');
  }
}