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
  const [searchState, setSearchState] = useState({
    query: '',
    country: '',
    region: '',
    apiKey: '',
    resultsLimit: 9,
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

  const validateServiceQuery = (query: string): boolean => {
    const serviceKeywords = [
      'service', 'provider', 'contractor', 'professional', 'company',
      'plumber', 'electrician', 'carpenter', 'painter', 'landscaper',
      'roofer', 'hvac', 'repair', 'maintenance', 'installation',
      'cleaning', 'construction', 'builder', 'consultant', 'expert',
      'specialist', 'technician', 'handyman', 'contractor', 'pro',
      // Add plurals
      'plumbers', 'electricians', 'carpenters', 'painters', 'landscapers',
      'roofers', 'cleaners', 'builders', 'consultants', 'experts',
      'specialists', 'technicians', 'handymen', 'contractors', 'pros'
    ];
    
    const words = query.toLowerCase().split(' ');
    return serviceKeywords.some(keyword => 
      words.includes(keyword.toLowerCase())
    );
  };

  const handleSearch = async () => {
    if (!searchState.query.trim()) {
      toast.error('Please enter a search query');
      return;
    }

    if (!validateServiceQuery(searchState.query)) {
      toast.error('Please enter a valid service provider category (e.g., plumbers, electricians, contractors)');
      return;
    }

    setIsSearching(true);
    
    // Calculate new limit based on current results
    const newLimit = results.currentResults.length + 9;
    
    const searchResult = await performSearch(
      searchState.query,
      searchState.country,
      searchState.region,
      searchState.apiKey,
      newLimit
    );
    
    setIsSearching(false);

    if (searchResult) {
      // Filter out any URLs we already have
      const newResults = searchResult.results.filter(
        newResult => !results.currentResults.some(
          existing => existing.url === newResult.url
        )
      );
      
      // Combine with existing results
      const combinedResults = [...results.currentResults, ...newResults];
      
      setResults({
        currentResults: combinedResults,
        hasMore: searchResult.hasMore,
      });
      onResults(combinedResults);
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