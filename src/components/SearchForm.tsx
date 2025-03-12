
import React from 'react';
import { useSearchLimits } from '@/hooks/useSearchLimits';
import SearchInputs from './SearchInputs';
import ProcessingIndicator from './ProcessingIndicator';
import { Info } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface SearchFormProps {
  query: string;
  country: string;
  region: string;
  apiKey: string;  // Keeping this prop for compatibility
  isProcessing: boolean;
  isSearching: boolean;
  onQueryChange: (value: string) => void;
  onCountryChange: (value: string) => void;
  onRegionChange: (value: string) => void;
  onApiKeyChange: (value: string) => void;  // Keeping this handler for compatibility
  onSubmit: () => void;
}

const SearchForm = ({
  query,
  country,
  region,
  apiKey,  // Keeping this prop for compatibility
  isProcessing,
  isSearching,
  onQueryChange,
  onCountryChange,
  onRegionChange,
  onApiKeyChange,  // Keeping this handler for compatibility
  onSubmit
}: SearchFormProps) => {
  const { searchesLeft, isLoading, isUnlimited } = useSearchLimits();
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-cyan-100">Search Businesses</h2>
        {!isLoading && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-2 text-sm text-cyan-200/70">
                  <Info className="w-4 h-4" />
                  {isUnlimited ? (
                    <span>Unlimited searches</span>
                  ) : searchesLeft !== null ? (
                    <span>{searchesLeft} searches remaining this month</span>
                  ) : (
                    <span>Loading search limit...</span>
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Your search limit resets at the start of each month</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>

      <SearchInputs
        query={query}
        country={country}
        region={region}
        apiKey={apiKey}  // Passing this for compatibility
        isProcessing={isProcessing}
        isSearching={isSearching}
        onQueryChange={onQueryChange}
        onCountryChange={onCountryChange}
        onRegionChange={onRegionChange}
        onApiKeyChange={onApiKeyChange}  // Passing this for compatibility
      />
    </form>
  );
};

export default SearchForm;
