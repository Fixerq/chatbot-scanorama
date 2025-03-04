
import React, { useEffect } from 'react';
import { Result } from './ResultsTable';
import { useSearchState } from '../hooks/useSearchState';
import SearchForm from './SearchForm';
import LoadMoreButton from './LoadMoreButton';
import { useSearchOperations } from '@/hooks/useSearchOperations';

interface SearchFormContainerProps {
  onResults: (results: Result[]) => void;
  onPartialResults?: (partialResults: Result[]) => void;
  onHasMoreChange?: (hasMore: boolean) => void;
  isProcessing: boolean;
  setIsProcessing: (processing: boolean) => void;
  triggerNewSearch?: boolean;
}

const SearchFormContainer = ({ 
  onResults, 
  onPartialResults,
  onHasMoreChange,
  isProcessing, 
  setIsProcessing, 
  triggerNewSearch 
}: SearchFormContainerProps) => {
  const {
    searchState,
    updateSearchState,
    resetSearch
  } = useSearchState();

  const {
    results,
    isSearching,
    handleSearch,
    handleLoadMore,
    loadingPages
  } = useSearchOperations((results) => {
    // Pass results to both callbacks
    onResults(results);
    if (onPartialResults) {
      onPartialResults(results);
    }
  });

  const onSubmit = () => {
    setIsProcessing(true);
    // Clear any previous results first to avoid showing old results during a new search
    onResults([]);
    console.log('Search form submitted with:', searchState);
    
    // Ensure region is properly formatted
    const formattedRegion = searchState.region ? searchState.region.trim() : '';
    
    handleSearch(
      searchState.query,
      searchState.country,
      formattedRegion,
      searchState.apiKey,
      searchState.resultsLimit
    );
  };

  const onLoadMore = (pageNumber?: number) => {
    const nextPage = pageNumber || searchState.currentPage + 1;
    
    // Prevent duplicate loading
    if (loadingPages?.includes(nextPage)) {
      console.log(`Already loading page ${nextPage}, ignoring duplicate request`);
      return;
    }
    
    // If a page number is specified, it means we're jumping to a specific page
    // and may need to load multiple pages of data
    const forcePagination = pageNumber !== undefined && pageNumber > searchState.currentPage + 1;
    
    setIsProcessing(true);
    console.log(`Loading more results for page ${nextPage}, forcePagination: ${forcePagination}`);
    
    updateSearchState({ 
      currentPage: nextPage
    });

    handleLoadMore(nextPage, forcePagination);
  };

  React.useEffect(() => {
    if (triggerNewSearch) {
      resetSearch();
      console.log('Search form reset triggered');
    }
  }, [triggerNewSearch, resetSearch]);

  React.useEffect(() => {
    if (onHasMoreChange) {
      onHasMoreChange(results.hasMore);
    }
    
    if (!isSearching && isProcessing) {
      console.log('Search completed, setting isProcessing to false');
      setIsProcessing(false);
    }
  }, [results.hasMore, isSearching, isProcessing, onHasMoreChange, setIsProcessing]);

  return (
    <div className="space-y-4">
      <SearchForm
        query={searchState.query}
        country={searchState.country}
        region={searchState.region}
        apiKey={searchState.apiKey}
        isProcessing={isProcessing}
        isSearching={isSearching}
        onQueryChange={(value) => updateSearchState({ query: value })}
        onCountryChange={(value) => updateSearchState({ country: value })}
        onRegionChange={(value) => updateSearchState({ region: value })}
        onApiKeyChange={(value) => updateSearchState({ apiKey: value })}
        onSubmit={onSubmit}
      />
      
      {results.hasMore && (
        <LoadMoreButton 
          onLoadMore={onLoadMore}
          isProcessing={isProcessing}
        />
      )}
    </div>
  );
};

export default SearchFormContainer;
