
import React from 'react';

interface ApiKeyInputProps {
  value: string;
  onChange: (value: string) => void;
}

const ApiKeyInput = ({ value, onChange }: ApiKeyInputProps) => {
  // Since we're no longer using Firecrawl, we'll just return null
  // The parent component should handle API key management
  return null;
};

export default ApiKeyInput;
