import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Result } from '@/components/ResultsTable';
import { executeSearch, loadMore } from '@/utils/search/operations';
import { useSearchResults } from '@/hooks/results';
import { useSearchValidation } from '@/hooks/useSearchValidation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { COUNTRIES } from '@/constants/countries';

interface SearchBusinessesProps {
  onResults: (results: Result[]) => void;
  resultsPerPage?: number;
}

const SearchBusinesses: React.FC<SearchBusinessesProps> = ({ 
  onResults,
  resultsPerPage = 10
}) => {
  // Search form state
  const [query, setQuery] = useState('');
  const [country, setCountry] = useState('');
  const [region, setRegion] = useState('');
  const [apiKey, setApiKey] = useState('');
  
  // Results state
  const { 
    results, 
    isSearching, 
    setIsSearching, 
    updateResults 
  } = useSearchResults(onResults);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [displayedResults, setDisplayedResults] = useState<Result[]>([]);
  const [lastSearchParams, setLastSearchParams] = useState<{
    query: string;
    country: string;
    region: string;
  } | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  
  // Validation
  const { validateSearchParams } = useSearchValidation();

  // Update displayed results when pagination changes
  useEffect(() => {
    if (results.currentResults.length > 0) {
      const startIndex = 0;
      const endIndex = Math.min(
        currentPage * resultsPerPage, 
        results.currentResults.length
      );
      
      setDisplayedResults(results.currentResults.slice(startIndex, endIndex));
    } else {
      setDisplayedResults([]);
    }
  }, [results.currentResults, currentPage, resultsPerPage]);

  // Handle form submission
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateSearchParams(query, country)) {
      return;
    }

    setIsSearching(true);
    setCurrentPage(1);
    
    // Save search parameters for pagination
    setLastSearchParams({
      query,
      country,
      region
    });
    
    try {
      // Initial search request
      const initialLimit = resultsPerPage * 3; // Get 3 pages worth of results initially
      const searchResult = await executeSearch(
        query,
        country,
        region,
        apiKey,
        initialLimit
      );
      
      if (!searchResult) {
        updateResults([], false);
        toast.error('Search failed. Please try again.');
        return;
      }
      
      if (searchResult.newResults.length === 0) {
        toast.info('No results found. Try different search terms or location.');
        updateResults([], false);
        return;
      }
      
      console.log(`Found ${searchResult.newResults.length} results`);
      updateResults(searchResult.newResults, searchResult.hasMore);
      
      // Set initial page of displayed results
      setCurrentPage(1);
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Search service is currently unavailable. Please try again later.');
      updateResults([], false);
    } finally {
      setIsSearching(false);
    }
  };
  
  // Handle load more button click
  const handleLoadMore = async () => {
    if (isSearching || loadingMore || !lastSearchParams || !results.hasMore) {
      return;
    }
    
    setLoadingMore(true);
    
    try {
      // Calculate target results count based on current page
      const nextPage = currentPage + 1;
      const targetResultsCount = nextPage * resultsPerPage;
      
      // If we already have enough results, just update pagination
      if (results.currentResults.length >= targetResultsCount) {
        setCurrentPage(nextPage);
        setLoadingMore(false);
        return;
      }
      
      // Otherwise, fetch more results
      const { query, country, region } = lastSearchParams;
      
      const moreResults = await loadMore(
        query,
        country,
        region,
        results.currentResults,
        targetResultsCount
      );
      
      if (!moreResults) {
        toast.error('Failed to load more results');
        return;
      }
      
      if (moreResults.newResults.length === 0) {
        toast.info('No more results available');
        updateResults(results.currentResults, false);
        return;
      }
      
      // Combine existing results with new ones
      const allResults = [...results.currentResults, ...moreResults.newResults];
      updateResults(allResults, moreResults.hasMore);
      
      // Update current page
      setCurrentPage(nextPage);
    } catch (error) {
      console.error('Load more error:', error);
      toast.error('Failed to load more results');
    } finally {
      setLoadingMore(false);
    }
  };
  
  // Render component
  return (
    <div className="search-businesses">
      <form onSubmit={handleSearch} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label htmlFor="query" className="text-sm font-medium">
              Search Term
            </label>
            <Input
              id="query"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. plumber, dentist, restaurant"
              disabled={isSearching}
              required
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="country" className="text-sm font-medium">
              Country
            </label>
            <Select 
              value={country} 
              onValueChange={setCountry}
              disabled={isSearching}
            >
              <SelectTrigger id="country">
                <SelectValue placeholder="Select country" />
              </SelectTrigger>
              <SelectContent>
                {COUNTRIES.map((countryOption) => (
                  <SelectItem key={countryOption} value={countryOption}>
                    {countryOption}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <label htmlFor="region" className="text-sm font-medium">
              State/Region
            </label>
            <Input
              id="region"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              placeholder="e.g. California, Western Australia"
              disabled={isSearching}
            />
          </div>
        </div>
        
        <Button 
          type="submit" 
          disabled={isSearching}
          className="w-full md:w-auto"
        >
          {isSearching ? 'Searching...' : 'Search'}
        </Button>
      </form>
      
      {/* Results summary */}
      {results.currentResults.length > 0 && (
        <div className="mt-6 flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm text-muted-foreground">
              Found {results.currentResults.length} websites
              {displayedResults.length < results.currentResults.length && 
                ` (showing ${displayedResults.length})`}
            </p>
          </div>
          
          {/* Load more button */}
          {results.hasMore && currentPage * resultsPerPage < results.currentResults.length && (
            <Button
              variant="outline"
              onClick={handleLoadMore}
              disabled={loadingMore}
              className="mt-2 md:mt-0"
            >
              {loadingMore ? 'Loading...' : 'Load More'}
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchBusinesses;
