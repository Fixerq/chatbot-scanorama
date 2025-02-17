
import React, { useState } from 'react';
import SearchFormContainer from '@/components/SearchFormContainer';
import Results from '@/components/Results';
import { Result } from '@/components/ResultsTable';
import { toast } from 'sonner';

interface SearchInterfaceProps {
  initialSearch?: {
    query: string;
    country: string;
    region: string;
  };
}

const SearchInterface: React.FC<SearchInterfaceProps> = ({ initialSearch }) => {
  const [results, setResults] = useState<Result[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [searchParams, setSearchParams] = useState({
    query: initialSearch?.query || '',
    country: initialSearch?.country || '',
    region: initialSearch?.region || ''
  });

  const handleResults = async (newResults: Result[]) => {
    console.log('New search results received:', newResults);
    setResults(newResults);
    
    if (newResults.length === 0) {
      toast.info('No results found for your search.');
      return;
    }
    
    toast.success(`Found ${newResults.length} result${newResults.length === 1 ? '' : 's'}`);
  };

  const handleSearchError = (error: Error) => {
    console.error('Search error:', error);
    toast.error('An error occurred during search. Please try again.');
    setIsProcessing(false);
  };

  const handleResultUpdate = (updatedResult: Result) => {
    setResults(prevResults => 
      prevResults.map(result => 
        result.url === updatedResult.url ? updatedResult : result
      )
    );
  };

  const handleNewSearch = () => {
    setResults([]);
    setSearchParams({
      query: '',
      country: '',
      region: ''
    });
  };

  return (
    <div className="space-y-8">
      <SearchFormContainer 
        onResults={handleResults}
        isProcessing={isProcessing}
        setIsProcessing={setIsProcessing}
        onError={handleSearchError}
        onSearchParamsChange={setSearchParams}
      />
      
      <Results 
        results={results}
        onExport={() => {}} 
        onNewSearch={handleNewSearch}
        hasMore={false}
        onLoadMore={() => {}}
        isLoadingMore={false}
        isAnalyzing={isAnalyzing}
        onResultUpdate={handleResultUpdate}
      />
    </div>
  );
};

export default SearchInterface;
