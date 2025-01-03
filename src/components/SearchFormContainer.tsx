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
    resultsLimit: 10,
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
    
    // Keep track of existing results
    const existingResults = results.currentResults;
    
    const searchResult = await performSearch(
      searchState.query,
      searchState.country,
      searchState.region,
      searchState.apiKey,
      searchState.resultsLimit
    );
    
    setIsSearching(false);

    if (searchResult) {
      // Combine existing results with new ones, filtering out duplicates
      const newResults = searchResult.results.filter(
        newResult => !existingResults.some(
          existing => existing.url === newResult.url
        )
      );
      
      const combinedResults = [...existingResults, ...newResults];
      
      setResults({
        currentResults: combinedResults,
        hasMore: searchResult.hasMore,
      });
      onResults(combinedResults);
    }
  };

  const handleLoadMore = async () => {
    const nextPage = searchState.currentPage + 1;
    const newLimit = searchState.resultsLimit + 10;
    
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

    if (moreResults && moreResults.newResults.length > 0) {
      // Filter out any duplicate results
      const newUniqueResults = moreResults.newResults.filter(
        newResult => !results.currentResults.some(
          existing => existing.url === newResult.url
        )
      );
      
      const updatedResults = [...results.currentResults, ...newUniqueResults];
      setResults({
        currentResults: updatedResults,
        hasMore: moreResults.hasMore,
      });
      onResults(updatedResults);
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
