import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Result } from './ResultsTable';
import { FirecrawlService } from '../utils/FirecrawlService';
import SearchForm from './SearchForm';
import LoadMoreButton from './LoadMoreButton';

interface SearchFormContainerProps {
  onResults: (results: Result[]) => void;
  isProcessing: boolean;
}

const SearchFormContainer = ({ onResults, isProcessing }: SearchFormContainerProps) => {
  const [query, setQuery] = useState('');
  const [country, setCountry] = useState('');
  const [region, setRegion] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [resultsLimit, setResultsLimit] = useState(10);
  const [hasMore, setHasMore] = useState(false);
  const [currentResults, setCurrentResults] = useState<Result[]>([]);

  useEffect(() => {
    const savedApiKey = FirecrawlService.getApiKey();
    if (savedApiKey) {
      setApiKey(savedApiKey);
    }
  }, []);

  const handleSearch = async (searchQuery: string, searchCountry: string, searchRegion: string) => {
    if (!apiKey) {
      toast.error('Please enter your Firecrawl API key');
      return;
    }

    FirecrawlService.saveApiKey(apiKey);

    try {
      const response = await FirecrawlService.searchWebsites(searchQuery, searchCountry, searchRegion, resultsLimit);

      if (!response.success) {
        toast.error(response.error || 'Failed to search websites');
        return;
      }

      const results = response.urls!.map((url: string) => ({
        url,
        status: 'Processing...'
      }));

      setHasMore(response.hasMore || false);
      setCurrentResults(results);
      onResults(results);
      toast.success(`Found ${results.length} websites to analyze`);

    } catch (error) {
      console.error('Search error:', error);
      toast.error('Failed to search websites. Please check your API key and try again.');
    }
  };

  const handleLoadMore = async () => {
    try {
      const newLimit = resultsLimit + 10;
      setResultsLimit(newLimit);
      
      const response = await FirecrawlService.searchWebsites(query, country, region, newLimit);
      
      if (response.success && response.urls) {
        const newResults = response.urls
          .map((url: string) => ({
            url,
            status: 'Processing...'
          }))
          // Filter out duplicates based on URL
          .filter((newResult: Result) => 
            !currentResults.some(existingResult => existingResult.url === newResult.url)
          );
        
        const combinedResults = [...currentResults, ...newResults];
        setCurrentResults(combinedResults);
        setHasMore(response.hasMore || false);
        onResults(combinedResults);
        
        if (newResults.length > 0) {
          toast.success(`Loaded ${newResults.length} new websites`);
        } else {
          toast.info('No new websites found');
        }
      }
    } catch (error) {
      console.error('Load more error:', error);
      toast.error('Failed to load more results');
    }
  };

  return (
    <div className="space-y-4">
      <SearchForm
        query={query}
        country={country}
        region={region}
        apiKey={apiKey}
        isProcessing={isProcessing}
        onQueryChange={setQuery}
        onCountryChange={setCountry}
        onRegionChange={setRegion}
        onApiKeyChange={setApiKey}
        onSubmit={() => handleSearch(query, country, region)}
      />
      
      {hasMore && (
        <LoadMoreButton 
          onLoadMore={handleLoadMore}
          isProcessing={isProcessing}
        />
      )}
    </div>
  );
};

export default SearchFormContainer;