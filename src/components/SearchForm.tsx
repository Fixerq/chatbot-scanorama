import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Result } from './ResultsTable';
import ApiKeyInput from './ApiKeyInput';
import SearchInputs from './SearchInputs';
import { COUNTRIES } from '../constants/countries';

interface SearchFormProps {
  onResults: (results: Result[]) => void;
  isProcessing: boolean;
}

const SearchForm = ({ onResults, isProcessing }: SearchFormProps) => {
  const [query, setQuery] = useState('');
  const [country, setCountry] = useState('');
  const [apiKey, setApiKey] = useState('');

  useEffect(() => {
    const savedApiKey = localStorage.getItem('firecrawl_api_key');
    if (savedApiKey) {
      setApiKey(savedApiKey);
    }
  }, []);

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

    localStorage.setItem('firecrawl_api_key', apiKey);

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
      <ApiKeyInput 
        apiKey={apiKey}
        onChange={setApiKey}
      />
      <SearchInputs
        query={query}
        country={country}
        onQueryChange={setQuery}
        onCountryChange={setCountry}
        isProcessing={isProcessing}
        countries={COUNTRIES}
      />
    </form>
  );
};

export default SearchForm;