import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Result } from './ResultsTable';
import ApiKeyInput from './ApiKeyInput';
import SearchInputs from './SearchInputs';
import { COUNTRIES } from '../constants/countries';
import { FirecrawlService } from '../utils/FirecrawlService';

interface SearchFormProps {
  onResults: (results: Result[]) => void;
  isProcessing: boolean;
}

const SearchForm = ({ onResults, isProcessing }: SearchFormProps) => {
  const [query, setQuery] = useState('');
  const [country, setCountry] = useState('');
  const [region, setRegion] = useState('');
  const [apiKey, setApiKey] = useState('');

  useEffect(() => {
    const savedApiKey = FirecrawlService.getApiKey();
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

    FirecrawlService.saveApiKey(apiKey);

    try {
      const response = await FirecrawlService.searchWebsites(query, country, region);

      if (!response.success) {
        toast.error(response.error || 'Failed to search websites');
        return;
      }

      const results = response.urls!.map((url: string) => ({
        url,
        status: 'Processing...'
      }));

      onResults(results);
      toast.success(`Found ${results.length} websites to analyze`);

    } catch (error) {
      console.error('Search error:', error);
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
        region={region}
        onQueryChange={setQuery}
        onCountryChange={setCountry}
        onRegionChange={setRegion}
        isProcessing={isProcessing}
        countries={COUNTRIES}
      />
    </form>
  );
};

export default SearchForm;