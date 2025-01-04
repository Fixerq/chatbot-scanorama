import React from 'react';
import { FirecrawlService } from '../utils/firecrawl/FirecrawlService';

interface ApiKeyInputProps {
  value: string;
  onChange: (value: string) => void;
}

const ApiKeyInput = ({ value, onChange }: ApiKeyInputProps) => {
  React.useEffect(() => {
    // Set the hardcoded API key
    onChange(FirecrawlService.getApiKey());
  }, [onChange]);

  return null; // No need to render anything since we're using a hardcoded key
};

export default ApiKeyInput;