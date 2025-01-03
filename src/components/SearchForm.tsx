import React from 'react';
import { Button } from "@/components/ui/button";
import SearchInputs from './SearchInputs';
import ApiKeyInput from './ApiKeyInput';
import { COUNTRIES } from '../constants/countries';

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
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <ApiKeyInput
          value={apiKey}
          onChange={onApiKeyChange}
        />
        <SearchInputs
          query={query}
          country={country}
          region={region}
          onQueryChange={onQueryChange}
          onCountryChange={onCountryChange}
          onRegionChange={onRegionChange}
          isProcessing={isProcessing}
          isSearching={isSearching}
          countries={COUNTRIES}
        />
      </div>
      <Button 
        type="submit"
        disabled={isProcessing || isSearching || !apiKey}
        className="w-full"
      >
        {isSearching ? "Searching..." : "Search"}
      </Button>
    </form>
  );
};

export default SearchForm;