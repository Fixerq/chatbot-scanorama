import React from 'react';
import ApiKeyInput from './ApiKeyInput';
import SearchInputs from './SearchInputs';
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
    <form onSubmit={handleSubmit} className="space-y-4">
      <ApiKeyInput 
        apiKey={apiKey}
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
    </form>
  );
};

export default SearchForm;