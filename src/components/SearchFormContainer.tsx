import React, { useState, useEffect } from 'react';
import { Result } from './ResultsTable';
import { FirecrawlService } from '../utils/firecrawl';
import { performSearch, loadMoreResults } from '../utils/searchUtils';
import SearchForm from './SearchForm';
import LoadMoreButton from './LoadMoreButton';

interface SearchFormContainerProps {
  onResults: (results: Result[]) => void;
  isProcessing: boolean;
}

const SearchFormContainer = ({ onResults, isProcessing }: SearchFormContainerProps) => {
  const [searchState, setSearchState] = useState({
    query: '',
    country: '',
    region: '',
    apiKey: '',
    resultsLimit: 20, // Increased initial limit
    currentPage: 1,
  });

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

  const handleSearch = async () => {
    setIsSearching(true);
    setSearchState(prev => ({ ...prev, currentPage: 1 })); // Reset page on new search
    
    const searchResult = await performSearch(
      searchState.query,
      searchState.country,
      searchState.region,
      searchState.apiKey,
      searchState.resultsLimit
    );
    setIsSearching(false);

    if (searchResult) {
      setResults({
        currentResults: searchResult.results,
        hasMore: searchResult.hasMore,
      });
      onResults(searchResult.results);
    }
  };

  const handleLoadMore = async () => {
    const nextPage = searchState.currentPage + 1;
    const newLimit = searchState.resultsLimit + 20; // Increase limit by 20 each time
    
    setSearchState(prev => ({ 
      ...prev, 
      currentPage: nextPage,
      resultsLimit: newLimit 
    }));
    
    const moreResults = await loadMoreResults(
      searchState.query,
      searchState.country,
      searchState.region,
      results.currentResults,
      newLimit
    );

    if (moreResults) {
      const combinedResults = [...results.currentResults, ...moreResults.newResults];
      setResults({
        currentResults: combinedResults,
        hasMore: moreResults.hasMore,
      });
      onResults(combinedResults);
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