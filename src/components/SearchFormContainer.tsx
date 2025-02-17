
import React from 'react';
import { SearchResult } from '@/utils/types/search';
import { useSearchState } from '../hooks/useSearchState';
import SearchForm from './SearchForm';
import LoadMoreButton from './LoadMoreButton';
import { useSearchOperations } from '@/hooks/useSearchOperations';

interface SearchFormContainerProps {
  onResults: (results: SearchResult[]) => void;
  isProcessing: boolean;
  setIsProcessing: (value: boolean) => void;
  triggerNewSearch?: boolean;
  onError?: (error: Error) => void;
  onSearchParamsChange?: (params: { query: string; country: string; region: string }) => void;
}

const SearchFormContainer = ({ 
  onResults, 
  isProcessing, 
  setIsProcessing,
  triggerNewSearch,
  onError,
  onSearchParamsChange 
}: SearchFormContainerProps) => {
  const {
    searchState,
    updateSearchState,
    resetSearch
  } = useSearchState();

  const {
    isSearching,
    handleSearch,
    handleLoadMore,
    nextPageToken
  } = useSearchOperations(onResults);

  const onSubmit = () => {
    setIsProcessing(true);
    handleSearch(
      searchState.query,
      searchState.country,
      searchState.region,
      searchState.apiKey,
      searchState.resultsLimit
    ).catch(error => {
      if (onError) {
        onError(error);
      }
    }).finally(() => {
      setIsProcessing(false);
    });

    if (onSearchParamsChange) {
      onSearchParamsChange({
        query: searchState.query,
        country: searchState.country,
        region: searchState.region
      });
    }
  };

  const onLoadMore = () => {
    const nextPage = searchState.currentPage + 1;
    const newLimit = searchState.resultsLimit + 10;
    
    updateSearchState({ 
      currentPage: nextPage,
      resultsLimit: newLimit 
    });

    handleLoadMore(
      searchState.query,
      searchState.country,
      searchState.region,
      nextPage,
      newLimit
    );
  };

  React.useEffect(() => {
    if (triggerNewSearch) {
      resetSearch();
    }
  }, [triggerNewSearch, resetSearch]);

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
      
      {nextPageToken && (
        <LoadMoreButton 
          onLoadMore={onLoadMore}
          isProcessing={isProcessing}
        />
      )}
    </div>
  );
};

export default SearchFormContainer;
