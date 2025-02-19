
import React, { useState } from 'react';
import SearchFormContainer from '@/components/SearchFormContainer';
import Results from '@/components/Results';
import { Result } from '@/components/ResultsTable';
import { useSearchOperations } from '@/hooks/useSearchOperations';
import { toast } from 'sonner';

interface SearchInterfaceProps {
  initialSearch?: {
    query: string;
    country: string;
    region: string;
  };
}

const ZAPIER_WEBHOOK_URL = 'https://hooks.zapier.com/hooks/catch/2694924/2wqea0g/';

const SearchInterface: React.FC<SearchInterfaceProps> = ({ initialSearch }) => {
  const [results, setResults] = useState<Result[]>([]);
  const { handleSearch, handleLoadMore, isSearching } = useSearchOperations(setResults);
  const [isProcessing, setIsProcessing] = useState(false);

  const sendToZapier = async (results: Result[]) => {
    console.log('Sending results to Zapier:', results);
    
    try {
      const payload = results.map(result => ({
        business_name: result.details?.business_name || result.title || 'Unknown',
        url: result.url
      }));

      const response = await fetch(ZAPIER_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        mode: 'no-cors', // Required for Zapier webhooks
        body: JSON.stringify(payload),
      });

      // Since we're using no-cors, we won't get a proper response status
      toast.success('Search results sent to Zapier');
    } catch (error) {
      console.error('Error sending to Zapier:', error);
      toast.error('Failed to send results to Zapier');
    }
  };

  const handleResults = async (newResults: Result[]) => {
    console.log('Search results received:', newResults);
    if (newResults.length > 0) {
      await sendToZapier(newResults);
    }
  };

  const handleSearchError = (error: Error) => {
    console.error('Search error:', error);
    setIsProcessing(false);
  };

  const handleSearchParamsChange = async (params: { query: string; country: string; region: string }) => {
    setIsProcessing(true);
    await handleSearch(params.query, params.country, params.region, '', 25);
    setIsProcessing(false);
  };

  const handleNewSearch = () => {
    window.location.reload();
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
        hasMore={true}
        onLoadMore={(page) => handleLoadMore('', '', '', page, (page + 1) * 25)}
        isLoadingMore={false}
        isAnalyzing={isSearching}
        onResultUpdate={undefined}
      />
    </div>
  );
};

export default SearchInterface;

