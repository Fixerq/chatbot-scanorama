import React from 'react';
import { ApiKeyService } from '../utils/apiKeyService';

interface ApiKeyInputProps {
  value: string;
  onChange: (value: string) => void;
}

const ApiKeyInput = ({ value, onChange }: ApiKeyInputProps) => {
  React.useEffect(() => {
    // Set the API key for search operations
    onChange(ApiKeyService.getApiKey());
  }, [onChange]);

  return null; // No need to render anything since we're using a hardcoded key
};

export default ApiKeyInput;