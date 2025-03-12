
import React, { useEffect, useState } from 'react';
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
import { getRegionsForCountry } from '@/constants/regions';

interface SearchInputsProps {
  query: string;
  country: string;
  region: string;
  apiKey: string;  // Added apiKey prop
  isProcessing: boolean;
  isSearching: boolean;
  onQueryChange: (value: string) => void;
  onCountryChange: (value: string) => void;
  onRegionChange: (value: string) => void;
  onApiKeyChange: (value: string) => void;  // Added handler for apiKey changes
}

const SearchInputs = ({
  query,
  country,
  region,
  apiKey,  // Added apiKey
  onQueryChange,
  onCountryChange,
  onRegionChange,
  onApiKeyChange,  // Added handler
  isProcessing,
  isSearching,
}: SearchInputsProps) => {
  const [availableRegions, setAvailableRegions] = useState<string[]>([]);

  // Update available regions when country changes
  useEffect(() => {
    const regions = getRegionsForCountry(country);
    setAvailableRegions(regions);
    
    // Reset region selection if current region is not in the new country's regions
    if (region && regions.length > 0 && !regions.includes(region)) {
      onRegionChange('');
    }
  }, [country, region, onRegionChange]);

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
      <div className="flex gap-2 mb-4">
        {availableRegions.length > 0 ? (
          <Select value={region} onValueChange={onRegionChange}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Select region/state" />
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
      </div>
      {/* Add API Key input */}
      <div className="mb-4">
        <Input
          type="text"
          placeholder="Enter Google Places API Key"
          value={apiKey}
          onChange={(e) => onApiKeyChange(e.target.value)}
          className="w-full"
        />
      </div>
      <div>
        <Button 
          type="submit" 
          disabled={isProcessing || !query.trim()} 
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
