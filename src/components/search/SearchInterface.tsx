
import React, { useState } from 'react';
import SearchFormContainer from '@/components/SearchFormContainer';
import Results from '@/components/Results';
import { Result } from '@/components/ResultsTable';
import { useSearchOperations } from '@/hooks/useSearchOperations';
import { toast } from 'sonner';
import { sendWebhookData } from '@/utils/webhookService';

interface SearchInterfaceProps {
  initialSearch?: {
    query: string;
    country: string;
    region: string;
  };
}

const SearchInterface: React.FC<SearchInterfaceProps> = ({ initialSearch }) => {
  const [results, setResults] = useState<Result[]>([]);
  const { handleSearch, handleLoadMore, isSearching } = useSearchOperations(setResults);
  const [isProcessing, setIsProcessing] = useState(false);

  const sendToZapier = async (results: Result[]) => {
    console.log('Preparing results for Zapier:', results);
    
    try {
      const payload = results.map(result => ({
        business_name: result.details?.business_name || result.title || 'Unknown',
        url: result.url,
        timestamp: new Date().toISOString()
      }));

      await sendWebhookData(payload);
      console.log('Webhook sent successfully');
      toast.success('Search results sent to Zapier');
    } catch (error) {
      console.error('Failed to send webhook:', error);
      toast.error('Failed to send results to Zapier. Please try again.');
    }
  };

  const handleResults = async (newResults: Result[]) => {
    console.log('Search results received:', newResults);
    if (newResults.length > 0) {
      await sendToZapier(newResults);
    }
    setResults(newResults);
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
