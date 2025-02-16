
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import BatchProgress from './BatchProgress';
import { useBatchProgress } from '../hooks/useBatchProgress';

interface SearchFormProps {
  onResults?: (results: Array<{ website?: string }>) => void;
}

const SearchForm: React.FC<SearchFormProps> = ({ onResults }) => {
  const [query, setQuery] = React.useState('');
  const [location, setLocation] = React.useState('');
  const [isSearching, setIsSearching] = React.useState(false);
  const [batchId, setBatchId] = React.useState<string | null>(null);
  const batchProgress = useBatchProgress(batchId);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSearching(true);

    try {
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
              location,
              maxResults: 20
            }
          }
        });

      if (searchError) throw searchError;

      const urls = searchResult?.data.results
        .map(business => business.website)
        .filter((url): url is string => !!url); // Filter out null/undefined websites

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

      if (analysisError) throw analysisError;

      if (analysisResult?.batchId) {
        setBatchId(analysisResult.batchId);
        toast.success('Analysis started');
      }

      if (onResults) {
        onResults(searchResult.data.results);
      }

    } catch (error) {
      console.error('Search operation failed:', error);
      toast.error('Search operation failed. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSearch} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            placeholder="Business type (e.g. plumber)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full"
            required
          />
          
          <Select value={location} onValueChange={setLocation} required>
            <SelectTrigger>
              <SelectValue placeholder="Select location" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="AL">Alabama</SelectItem>
              <SelectItem value="AK">Alaska</SelectItem>
              <SelectItem value="AZ">Arizona</SelectItem>
              <SelectItem value="AR">Arkansas</SelectItem>
              <SelectItem value="CA">California</SelectItem>
              <SelectItem value="CO">Colorado</SelectItem>
              {/* Add more states as needed */}
            </SelectContent>
          </Select>

          <Button 
            type="submit" 
            disabled={isSearching || !query || !location}
            className="w-full md:w-auto"
          >
            {isSearching ? 'Searching...' : 'Search'}
          </Button>
        </div>
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
