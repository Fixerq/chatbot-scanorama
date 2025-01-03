import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Result } from './ResultsTable';
import ApiKeyInput from './ApiKeyInput';
import SearchInputs from './SearchInputs';
import { COUNTRIES } from '../constants/countries';
import { FirecrawlService } from '../utils/FirecrawlService';
import { Button } from './ui/button';

interface SearchFormProps {
  onResults: (results: Result[]) => void;
  isProcessing: boolean;
}

const SearchForm = ({ onResults, isProcessing }: SearchFormProps) => {
  const [query, setQuery] = useState('');
  const [country, setCountry] = useState('');
  const [region, setRegion] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [resultsLimit, setResultsLimit] = useState(25);
  const [hasMore, setHasMore] = useState(false);

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
      const response = await FirecrawlService.searchWebsites(query, country, region, resultsLimit);

      if (!response.success) {
        toast.error(response.error || 'Failed to search websites');
        return;
      }

      const results = response.urls!.map((url: string) => ({
        url,
        status: 'Processing...'
      }));

      setHasMore(response.hasMore || false);
      onResults(results);
      toast.success(`Found ${results.length} websites to analyze`);

    } catch (error) {
      console.error('Search error:', error);
      toast.error('Failed to search websites. Please check your API key and try again.');
    }
  };

  const handleLoadMore = async () => {
    try {
      const newLimit = resultsLimit + 25;
      setResultsLimit(newLimit);
      
      const response = await FirecrawlService.searchWebsites(query, country, region, newLimit);
      
      if (response.success && response.urls) {
        const results = response.urls.map((url: string) => ({
          url,
          status: 'Processing...'
        }));
        
        setHasMore(response.hasMore || false);
        onResults(results);
        toast.success(`Loaded ${results.length} websites`);
      }
    } catch (error) {
      console.error('Load more error:', error);
      toast.error('Failed to load more results');
    }
  };

  return (
    <div className="space-y-4">
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
      
      {hasMore && (
        <div className="flex justify-center mt-4">
          <Button 
            onClick={handleLoadMore}
            disabled={isProcessing}
            variant="outline"
          >
            Load More Results
          </Button>
        </div>
      )}
    </div>
  );
};

export default SearchForm;