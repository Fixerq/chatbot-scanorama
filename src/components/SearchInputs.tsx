
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
import { countries } from '@/constants/countries';
import { regions, getRegionsForCountry } from '@/constants/regions';

interface SearchInputsProps {
  query: string;
  country: string;
  region: string;
  isProcessing: boolean;
  isSearching: boolean;
  onQueryChange: (value: string) => void;
  onCountryChange: (value: string) => void;
  onRegionChange: (value: string) => void;
}

const SearchInputs = ({
  query,
  country,
  region,
  onQueryChange,
  onCountryChange,
  onRegionChange,
  isSearching,
}: SearchInputsProps) => {
  const availableRegions = getRegionsForCountry(country);
  const hasRegions = availableRegions.length > 0;

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
        <Select value={country} onValueChange={(value) => {
          onCountryChange(value);
          onRegionChange(''); // Reset region when country changes
        }}>
          <SelectTrigger className="w-1/3">
            <SelectValue placeholder="Select country" />
          </SelectTrigger>
          <SelectContent>
            {countries.map((countryOption) => (
              <SelectItem key={countryOption.code} value={countryOption.code}>
                {countryOption.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex gap-2 mb-8">
        {hasRegions ? (
          <Select value={region} onValueChange={onRegionChange}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Select state/region" />
            </SelectTrigger>
            <SelectContent>
              {availableRegions.map((regionOption) => (
                <SelectItem key={regionOption} value={regionOption}>
                  {regionOption}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <Input
            type="text"
            placeholder="Enter state/region (optional)"
            value={region}
            onChange={(e) => onRegionChange(e.target.value)}
            className="flex-1"
          />
        )}
        <Button 
          type="submit" 
          disabled={isSearching || !query.trim()} 
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
