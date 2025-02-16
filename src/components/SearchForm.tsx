
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import BatchProgress from './BatchProgress';
import { useBatchProgress } from '../hooks/useBatchProgress';
import { getRegionsForCountry } from '@/constants/regions';

interface SearchFormProps {
  query: string;
  country: string;
  region: string;
  apiKey?: string;
  isProcessing: boolean;
  isSearching: boolean;
  onQueryChange: (value: string) => void;
  onCountryChange: (value: string) => void;
  onRegionChange: (value: string) => void;
  onApiKeyChange?: (value: string) => void;
  onResults?: (results: Array<{ website?: string }>) => void;
  onSubmit: () => void;
}

const SearchForm: React.FC<SearchFormProps> = ({ 
  query,
  country,
  region,
  apiKey,
  isProcessing,
  isSearching,
  onQueryChange,
  onCountryChange,
  onRegionChange,
  onApiKeyChange,
  onResults,
  onSubmit 
}) => {
  const [batchId, setBatchId] = React.useState<string | null>(null);
  const batchProgress = useBatchProgress(batchId);
  const regions = getRegionsForCountry(country);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      console.log('Starting search with params:', { query, country, region });

      // First, search for businesses
      const { data: searchResult, error: searchError } = await supabase
        .functions.invoke<{
          data: {
            results: Array<{ website?: string }>;
          };
        }>('search-places', {
          body: { 
            action: 'search',
            params: {
              query,
              country,
              region,
              maxResults: 20
            }
          }
        });

      console.log('Search results:', searchResult);
      console.log('Search error:', searchError);

      if (searchError) throw searchError;

      if (!searchResult?.data?.results) {
        console.log('No results found in search response');
        toast.error('No results found');
        return;
      }

      console.log('Found results:', searchResult.data.results.length);

      const urls = searchResult.data.results
        .map(business => business.website)
        .filter((url): url is string => {
          const valid = !!url && url.startsWith('http');
          if (!valid && url) {
            console.log('Filtered out invalid URL:', url);
          }
          return valid;
        });

      console.log('Filtered website URLs:', urls);

      if (!urls?.length) {
        toast.error('No websites found to analyze');
        return;
      }

      // Start batch analysis
      const { data: analysisResult, error: analysisError } = await supabase
        .functions.invoke<{ batchId: string }>('analyze-website', {
          body: {
            urls,
            requestId: crypto.randomUUID()
          }
        });

      console.log('Analysis result:', analysisResult);
      console.log('Analysis error:', analysisError);

      if (analysisError) throw analysisError;

      if (analysisResult?.batchId) {
        setBatchId(analysisResult.batchId);
        toast.success('Analysis started');
      }

      if (onResults) {
        onResults(searchResult.data.results);
      }

      onSubmit();

    } catch (error) {
      console.error('Search operation failed:', error);
      toast.error('Search operation failed. Please try again.');
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSearch} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            placeholder="Business type (e.g. plumber)"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            className="w-full"
            required
          />
          
          <Select value={country} onValueChange={onCountryChange} required>
            <SelectTrigger>
              <SelectValue placeholder="Select country" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="US">United States</SelectItem>
              <SelectItem value="CA">Canada</SelectItem>
              <SelectItem value="GB">United Kingdom</SelectItem>
              <SelectItem value="AU">Australia</SelectItem>
              <SelectItem value="DE">Germany</SelectItem>
            </SelectContent>
          </Select>

          <Select value={region} onValueChange={onRegionChange} required>
            <SelectTrigger>
              <SelectValue placeholder="Select state/region" />
            </SelectTrigger>
            <SelectContent>
              {regions.map((region) => (
                <SelectItem key={region} value={region}>
                  {region}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button 
          type="submit" 
          disabled={isSearching || !query || !country || !region}
          className="w-full md:w-auto"
        >
          {isSearching ? 'Searching...' : 'Search'}
        </Button>
      </form>

      {batchId && batchProgress && (
        <BatchProgress
          totalUrls={batchProgress.totalUrls}
          processedUrls={batchProgress.processedUrls}
          status={batchProgress.status}
          error={batchProgress.error}
        />
      )}
    </div>
  );
};

export default SearchForm;
