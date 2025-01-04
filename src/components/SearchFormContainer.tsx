import React, { useState, useEffect } from 'react';
import { Result } from './ResultsTable';
import { FirecrawlService } from '../utils/firecrawl';
import { performSearch, loadMoreResults } from '../utils/searchUtils';
import SearchForm from './SearchForm';
import LoadMoreButton from './LoadMoreButton';
import { toast } from 'sonner';

interface SearchFormContainerProps {
  onResults: (results: Result[]) => void;
  isProcessing: boolean;
}

const SearchFormContainer = ({ onResults, isProcessing }: SearchFormContainerProps) => {
  const initialState = {
    query: '',
    country: '',
    region: '',
    apiKey: '',
    resultsLimit: 9,
    currentPage: 1,
  };

  const [searchState, setSearchState] = useState(initialState);

  const [results, setResults] = useState({
    currentResults: [] as Result[],
    hasMore: false,
  });

  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const savedApiKey = FirecrawlService.getApiKey();
    if (savedApiKey) {
      setSearchState(prev => ({ ...prev, apiKey: savedApiKey }));
    }
  }, []);

  const resetSearch = () => {
    setSearchState(prev => ({
      ...initialState,
      apiKey: prev.apiKey // Preserve the API key
    }));
    setResults({
      currentResults: [],
      hasMore: false,
    });
    onResults([]);
  };

  const handleSearch = async () => {
    if (!searchState.query.trim()) {
      toast.error('Please enter a search query');
      return;
    }

    if (!searchState.country) {
      toast.error('Please select a country');
      return;
    }

    setIsSearching(true);
    console.log('Starting search with params:', {
      query: searchState.query,
      country: searchState.country,
      region: searchState.region,
      limit: searchState.resultsLimit
    });
    
    try {
      const searchResult = await performSearch(
        searchState.query,
        searchState.country,
        searchState.region,
        searchState.apiKey,
        searchState.resultsLimit
      );
      
      if (searchResult) {
        // Filter out duplicates while keeping existing results
        const existingUrls = new Set(results.currentResults.map(r => r.url));
        const newResults = searchResult.results.filter(result => !existingUrls.has(result.url));
        
        console.log(`Found ${newResults.length} new results`);
        
        const combinedResults = [...results.currentResults, ...newResults];
        
        setResults({
          currentResults: combinedResults,
          hasMore: searchResult.hasMore,
        });
        onResults(combinedResults);
        
        if (newResults.length === 0) {
          toast.info('No new results found. Try adjusting your search terms.');
        } else {
          toast.success(`Found ${newResults.length} new results`);
        }
      }
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Failed to perform search. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleLoadMore = async () => {
    const nextPage = searchState.currentPage + 1;
    const newLimit = searchState.resultsLimit + 9;
    
    setSearchState(prev => ({ 
      ...prev, 
      currentPage: nextPage,
      resultsLimit: newLimit 
    }));

    console.log('Loading more results:', {
      page: nextPage,
      newLimit: newLimit
    });

    try {
      const moreResults = await loadMoreResults(
        searchState.query,
        searchState.country,
        searchState.region,
        results.currentResults,
        newLimit
      );

      if (moreResults && moreResults.newResults.length > 0) {
        const existingUrls = new Set(results.currentResults.map(r => r.url));
        const newUniqueResults = moreResults.newResults.filter(result => !existingUrls.has(result.url));
        
        console.log(`Found ${newUniqueResults.length} additional results`);
        
        const updatedResults = [...results.currentResults, ...newUniqueResults];
        setResults({
          currentResults: updatedResults,
          hasMore: moreResults.hasMore,
        });
        onResults(updatedResults);
        
        if (newUniqueResults.length > 0) {
          toast.success(`Loaded ${newUniqueResults.length} more results`);
        } else {
          toast.info('No more new results found');
        }
      }
    } catch (error) {
      console.error('Load more error:', error);
      toast.error('Failed to load more results. Please try again.');
    }
  };

  return (
    <div className="space-y-4">
      <SearchForm
        query={searchState.query}
        country={searchState.country}
        region={searchState.region}
        apiKey={searchState.apiKey}
        isProcessing={isProcessing}
        isSearching={isSearching}
        onQueryChange={(value) => setSearchState(prev => ({ ...prev, query: value }))}
        onCountryChange={(value) => setSearchState(prev => ({ ...prev, country: value }))}
        onRegionChange={(value) => setSearchState(prev => ({ ...prev, region: value }))}
        onApiKeyChange={(value) => setSearchState(prev => ({ ...prev, apiKey: value }))}
        onSubmit={handleSearch}
      />
      
      {results.hasMore && (
        <LoadMoreButton 
          onLoadMore={handleLoadMore}
          isProcessing={isProcessing}
        />
      )}
    </div>
  );
};

export default SearchFormContainer;