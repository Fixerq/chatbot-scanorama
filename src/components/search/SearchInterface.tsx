
import React, { useState } from 'react';
import SearchFormContainer from '@/components/SearchFormContainer';
import Results from '@/components/Results';
import { Result } from '@/components/ResultsTable';
import { useSearch } from '@/hooks/useSearch';

interface SearchInterfaceProps {
  initialSearch?: {
    query: string;
    country: string;
    region: string;
  };
}

const SearchInterface: React.FC<SearchInterfaceProps> = ({ initialSearch }) => {
  const { handleSearch, retryAnalysis, isSearching, results } = useSearch();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleResults = async (newResults: Result[]) => {
    console.log('Search results received:', newResults);
  };

  const handleSearchError = (error: Error) => {
    console.error('Search error:', error);
    setIsProcessing(false);
  };

  const handleSearchParamsChange = async (params: { query: string; country: string; region: string }) => {
    setIsProcessing(true);
    await handleSearch(params.query, params.country, params.region);
    setIsProcessing(false);
  };

  const handleNewSearch = () => {
    window.location.reload(); // Reset the entire search state
  };

  return (
    <div className="space-y-8">
      <SearchFormContainer 
        onResults={handleResults}
        isProcessing={isProcessing}
        setIsProcessing={setIsProcessing}
        onError={handleSearchError}
        onSearchParamsChange={handleSearchParamsChange}
      />
      
      <Results 
        results={results}
        onExport={() => {}} 
        onNewSearch={handleNewSearch}
        hasMore={false}
        onLoadMore={() => {}}
        isLoadingMore={false}
        isAnalyzing={isSearching}
        onResultUpdate={(updatedResult) => {
          if (updatedResult.error) {
            retryAnalysis(updatedResult.url);
          }
        }}
      />
    </div>
  );
};

export default SearchInterface;
