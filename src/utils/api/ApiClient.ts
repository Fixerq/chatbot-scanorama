
import { toast } from 'sonner';

interface ApiClientConfig {
  baseUrl?: string;
  timeout?: number;
  retries?: number;
}

interface RequestConfig extends RequestInit {
  timeout?: number;
  retries?: number;
}

export class ApiClient {
  private baseUrl: string;
  private defaultTimeout: number;
  private maxRetries: number;

  constructor(config: ApiClientConfig = {}) {
    this.baseUrl = config.baseUrl || '';
    this.defaultTimeout = config.timeout || 30000;
    this.maxRetries = config.retries || 3;
  }

  private async fetchWithTimeout(url: string, config: RequestConfig): Promise<Response> {
    const timeout = config.timeout || this.defaultTimeout;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...config,
        signal: controller.signal,
      });
      return response;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private async retryRequest(url: string, config: RequestConfig, attempt = 1): Promise<Response> {
    try {
      const response = await this.fetchWithTimeout(url, config);
      if (!response.ok && attempt < (config.retries || this.maxRetries)) {
        const backoff = Math.min(1000 * Math.pow(2, attempt), 10000);
        await new Promise(resolve => setTimeout(resolve, backoff));
        return this.retryRequest(url, config, attempt + 1);
      }
      return response;
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('Request timeout');
      }
      throw error;
    }
  }

  async request<T>(endpoint: string, config: RequestConfig = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    try {
      const response = await this.retryRequest(url, config);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      toast.error('Failed to complete request. Please try again.');
      throw error;
    }
  }
}

export const apiClient = new ApiClient();
