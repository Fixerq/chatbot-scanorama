import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { toast } from 'sonner';
import { Result } from './ResultsTable';

interface SearchFormProps {
  onResults: (results: Result[]) => void;
  isProcessing: boolean;
}

const SearchForm = ({ onResults, isProcessing }: SearchFormProps) => {
  const [query, setQuery] = useState('');
  const [apiKey, setApiKey] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!apiKey) {
      toast.error('Please enter your Firecrawl API key');
      return;
    }

    if (!query.trim()) {
      toast.error('Please enter a search query');
      return;
    }

    try {
      // First, get URLs using Firecrawl
      const crawlResponse = await fetch('https://api.firecrawl.co/api/v1/search', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          limit: 100,
          type: 'website'
        })
      });

      if (!crawlResponse.ok) {
        throw new Error('Failed to fetch URLs');
      }

      const data = await crawlResponse.json();
      const urls = data.results.map((result: any) => result.url);

      // Process URLs through chatbot detection
      const results = urls.map((url: string) => ({
        url,
        status: 'Processing...'
      }));

      onResults(results);
      toast.success(`Found ${urls.length} websites to analyze`);

    } catch (error) {
      toast.error('Failed to search websites. Please check your API key and try again.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Input
          type="password"
          placeholder="Enter your Firecrawl API key"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          className="w-full"
        />
      </div>
      <div className="flex gap-2">
        <Input
          type="text"
          placeholder="Enter niche (e.g., 'SaaS companies in healthcare')"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1"
        />
        <Button type="submit" disabled={isProcessing}>
          <Search className="w-4 h-4 mr-2" />
          Search
        </Button>
      </div>
    </form>
  );
};

export default SearchForm;