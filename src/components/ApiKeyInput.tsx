import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

interface ApiKeyInputProps {
  apiKey: string;
  onChange: (value: string) => void;
}

const ApiKeyInput = ({ apiKey, onChange }: ApiKeyInputProps) => {
  const handleRemoveApiKey = () => {
    localStorage.removeItem('firecrawl_api_key');
    onChange('');
    toast.success('API key removed successfully');
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          type="password"
          placeholder="Enter your Firecrawl API key"
          value={apiKey}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1"
        />
        {apiKey && (
          <Button
            type="button"
            variant="destructive"
            onClick={handleRemoveApiKey}
            className="whitespace-nowrap"
          >
            Remove API Key
          </Button>
        )}
      </div>
    </div>
  );
};

export default ApiKeyInput;