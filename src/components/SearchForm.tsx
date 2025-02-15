
import React from 'react';
import { useSubscriptionStatus } from '@/hooks/useSubscriptionStatus';
import SearchInputs from './SearchInputs';
import { Info } from 'lucide-react';

interface SearchFormProps {
  query: string;
  country: string;
  region: string;
  apiKey: string;
  isProcessing: boolean;
  isSearching: boolean;
  onQueryChange: (value: string) => void;
  onCountryChange: (value: string) => void;
  onRegionChange: (value: string) => void;
  onApiKeyChange: (value: string) => void;
  onSubmit: () => void;
}

const SearchForm = ({
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
  onSubmit
}: SearchFormProps) => {
  const { subscriptionData, isLoading } = useSubscriptionStatus();
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-cyan-100">Search Businesses</h2>
        {!isLoading && subscriptionData && (
          <div className="flex items-center gap-2 text-sm text-cyan-200/70">
            <Info className="w-4 h-4" />
            {subscriptionData.searchesRemaining === -1 ? (
              <span>Unlimited searches available</span>
            ) : (
              <span>{subscriptionData.searchesRemaining} searches remaining</span>
            )}
          </div>
        )}
      </div>

      <SearchInputs
        query={query}
        country={country}
        region={region}
        isProcessing={isProcessing}
        isSearching={isSearching}
        onQueryChange={onQueryChange}
        onCountryChange={onCountryChange}
        onRegionChange={onRegionChange}
      />
    </form>
  );
};

export default SearchForm;
