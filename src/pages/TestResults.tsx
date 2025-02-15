
import React, { useState } from 'react';
import { Result } from '@/components/ResultsTable';
import { toast } from 'sonner';
import { performGoogleSearch } from '@/utils/searchEngine';
import ResultsTable from '@/components/ResultsTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const TestResults = () => {
  const [results, setResults] = useState<Result[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [country, setCountry] = useState('US');
  const [region, setRegion] = useState('CA');

  const handleSearch = async () => {
    try {
      setIsLoading(true);
      const searchResult = await performGoogleSearch(query, country, region);

      if (!searchResult) {
        toast.error('No results found');
        return;
      }

      // Transform SearchResult to Result
      const transformedResults: Result[] = searchResult.results.map(result => ({
        url: result.url,
        title: result.title || '',
        description: result.description || '',
        details: {
          search_batch_id: searchResult.searchBatchId,
          title: result.title || '',
          description: result.description || '',
          business_name: result.details?.business_name || '',
          website_url: result.url,
          address: result.details?.address || '',
        },
        status: 'pending'
      }));

      setResults(transformedResults);
      toast.success(`Found ${transformedResults.length} results`);
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Search failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResultUpdate = (updatedResult: Result) => {
    setResults(prevResults => 
      prevResults.map(result => 
        result.url === updatedResult.url ? updatedResult : result
      )
    );
  };

  return (
    <div className="container py-8 space-y-6">
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Test Results Page</h1>
        
        <div className="flex gap-4">
          <Input
            placeholder="Search query"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="max-w-xs"
          />
          <Button 
            onClick={handleSearch}
            disabled={isLoading}
          >
            Search
          </Button>
        </div>
      </div>

      {results.length > 0 && (
        <ResultsTable 
          results={results}
          isLoading={isLoading}
          onResultUpdate={handleResultUpdate}
        />
      )}
    </div>
  );
};

export default TestResults;
