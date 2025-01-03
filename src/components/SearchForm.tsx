import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { toast } from 'sonner';
import { Result } from './ResultsTable';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SearchFormProps {
  onResults: (results: Result[]) => void;
  isProcessing: boolean;
}

const COUNTRIES = [
  "United States",
  "United Kingdom",
  "Canada",
  "Australia",
  "Germany",
  "France",
  "Spain",
  "Italy",
  "Japan",
  "Brazil",
  "India",
  "China",
  "Singapore",
  "Netherlands",
  "Sweden"
];

const SearchForm = ({ onResults, isProcessing }: SearchFormProps) => {
  const [query, setQuery] = useState('');
  const [country, setCountry] = useState('');
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

    if (!country) {
      toast.error('Please select a country');
      return;
    }

    try {
      const searchQuery = `${query} in ${country}`;

      const crawlResponse = await fetch('https://api.firecrawl.co/api/v1/search', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: searchQuery,
          limit: 100,
          type: 'website'
        })
      });

      if (!crawlResponse.ok) {
        throw new Error('Failed to fetch URLs');
      }

      const data = await crawlResponse.json();
      const urls = data.results.map((result: any) => result.url);

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
          placeholder="Enter niche (e.g., 'SaaS companies')"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1"
        />
        <Select value={country} onValueChange={setCountry}>
          <SelectTrigger className="w-1/3">
            <SelectValue placeholder="Select country" />
          </SelectTrigger>
          <SelectContent>
            {COUNTRIES.map((country) => (
              <SelectItem key={country} value={country}>
                {country}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button type="submit" disabled={isProcessing}>
          <Search className="w-4 h-4 mr-2" />
          Search
        </Button>
      </div>
    </form>
  );
};

export default SearchForm;