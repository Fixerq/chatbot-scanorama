
import React from 'react';
import { FirecrawlService } from '../utils/firecrawl/FirecrawlService';

interface ApiKeyInputProps {
  value: string;
  onChange: (value: string) => void;
}

const ApiKeyInput = ({ value, onChange }: ApiKeyInputProps) => {
  React.useEffect(() => {
    const initializeApiKey = async () => {
      try {
        const apiKey = await FirecrawlService.getApiKey();
        if (apiKey) {
          onChange(apiKey);
        }
      } catch (error) {
        console.error('Error initializing API key:', error);
      }
    };

    initializeApiKey();
  }, [onChange]);

  return null;
};

export default ApiKeyInput;
