import React from 'react';
import { Input } from '@/components/ui/input';
import { Search, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { COUNTRIES } from '@/constants/countries';

interface SearchInputsProps {
  query: string;
  country: string;
  region: string;
  onQueryChange: (value: string) => void;
  onCountryChange: (value: string) => void;
  onRegionChange: (value: string) => void;
  isProcessing: boolean;
  isSearching: boolean;
}

const SearchInputs = ({
  query,
  country,
  region,
  onQueryChange,
  onCountryChange,
  onRegionChange,
  isProcessing,
  isSearching,
}: SearchInputsProps) => {
  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          type="text"
          placeholder="Enter service provider category (e.g., 'plumbers', 'electricians')"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          className="flex-1"
          required
        />
        <Select value={country} onValueChange={onCountryChange}>
          <SelectTrigger className="w-1/3">
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
      <div className="flex gap-2 mb-8">
        <Input
          type="text"
          placeholder="Enter state/region (optional)"
          value={region}
          onChange={(e) => onRegionChange(e.target.value)}
          className="flex-1"
        />
        <Button 
          type="submit" 
          disabled={isProcessing || isSearching || !query.trim()} 
          className="w-32"
        >
          {isSearching ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Searching
            </>
          ) : (
            <>
              <Search className="w-4 h-4 mr-2" />
              Search
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default SearchInputs;