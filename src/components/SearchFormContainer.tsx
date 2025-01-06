import React from 'react';
import { Result } from './ResultsTable';
import { useSearchState } from '../hooks/useSearchState';
import { executeSearch, loadMore } from '../utils/searchOperations';
import SearchForm from './SearchForm';
import LoadMoreButton from './LoadMoreButton';
import { toast } from 'sonner';

interface SearchFormContainerProps {
  onResults: (results: Result[]) => void;
  isProcessing: boolean;
}

const SearchFormContainer = ({ onResults, isProcessing }: SearchFormContainerProps) => {
  const {
    searchState,
    results,
    isSearching,
    setIsSearching,
    setResults,
    resetSearch,
    updateSearchState
  } = useSearchState();

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
    
    try {
      // Reset results before starting new search
      setResults({
        currentResults: [],
        hasMore: false,
      });
      
      const searchResult = await executeSearch(
        searchState.query,
        searchState.country,
        searchState.region,
        searchState.apiKey,
        searchState.resultsLimit,
        []  // Start with empty results array for new search
      );
      
      if (searchResult) {
        // Filter out results without URLs
        const validResults = searchResult.newResults.filter(result => result.url);
        
        if (validResults.length === 0) {
          toast.info('No valid results found. Try adjusting your search terms.');
          return;
        }

        setResults({
          currentResults: validResults,
          hasMore: searchResult.hasMore,
        });
        onResults(validResults);
        toast.success(`Found ${validResults.length} results`);
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
    
    updateSearchState({ 
      currentPage: nextPage,
      resultsLimit: newLimit 
    });

    console.log('Loading more results:', {
      page: nextPage,
      newLimit: newLimit
    });

    try {
      const moreResults = await loadMore(
        searchState.query,
        searchState.country,
        searchState.region,
        results.currentResults,
        newLimit
      );

      if (moreResults && moreResults.newResults.length > 0) {
        // Filter out results without URLs
        const validNewResults = moreResults.newResults.filter(result => result.url);
        const existingUrls = new Set(results.currentResults.map(r => r.url));
        const newUniqueResults = validNewResults.filter(result => !existingUrls.has(result.url));
        
        if (newUniqueResults.length > 0) {
          const updatedResults = [...results.currentResults, ...newUniqueResults];
          setResults({
            currentResults: updatedResults,
            hasMore: moreResults.hasMore,
          });
          onResults(updatedResults);
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
        onQueryChange={(value) => updateSearchState({ query: value })}
        onCountryChange={(value) => updateSearchState({ country: value })}
        onRegionChange={(value) => updateSearchState({ region: value })}
        onApiKeyChange={(value) => updateSearchState({ apiKey: value })}
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