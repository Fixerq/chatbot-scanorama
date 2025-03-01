
import React from 'react';
import { Result } from './ResultsTable';
import { useSearchState } from '../hooks/useSearchState';
import SearchForm from './SearchForm';
import LoadMoreButton from './LoadMoreButton';
import { useSearchOperations } from '@/hooks/useSearchOperations';

interface SearchFormContainerProps {
  onResults: (results: Result[]) => void;
  isProcessing: boolean;
  setIsProcessing: (processing: boolean) => void;
  triggerNewSearch?: boolean;
}

const SearchFormContainer = ({ 
  onResults, 
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

  const onLoadMore = () => {
    const nextPage = searchState.currentPage + 1;
    const newLimit = searchState.resultsLimit + 10;
    
    setIsProcessing(true);
    console.log('Loading more results, page:', nextPage);
    
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
      console.log('Search form reset triggered');
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
