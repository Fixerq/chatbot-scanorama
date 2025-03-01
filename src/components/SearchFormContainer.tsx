
import React from 'react';
import { Result } from './ResultsTable';
import { useSearchState } from '../hooks/useSearchState';
import SearchForm from './SearchForm';
import LoadMoreButton from './LoadMoreButton';
import { useSearchOperations } from '@/hooks/useSearchOperations';

interface SearchFormContainerProps {
  onResults: (results: Result[]) => void;
  onHasMoreChange?: (hasMore: boolean) => void;
  isProcessing: boolean;
  setIsProcessing: (processing: boolean) => void;
  triggerNewSearch?: boolean;
}

const SearchFormContainer = ({ 
  onResults, 
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
    handleLoadMore
  } = useSearchOperations(onResults);

  const onSubmit = () => {
    setIsProcessing(true);
    console.log('Search form submitted with:', searchState);
    handleSearch(
      searchState.query,
      searchState.country,
      searchState.region,
      searchState.apiKey,
      searchState.resultsLimit
    );
  };

  const onLoadMore = (pageNumber?: number) => {
    const nextPage = pageNumber || searchState.currentPage + 1;
    
    setIsProcessing(true);
    console.log('Loading more results, page:', nextPage);
    
    updateSearchState({ 
      currentPage: nextPage
    });

    handleLoadMore(nextPage);
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
