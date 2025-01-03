import React from 'react';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SearchInputsProps {
  query: string;
  country: string;
  onQueryChange: (value: string) => void;
  onCountryChange: (value: string) => void;
  isProcessing: boolean;
  countries: string[];
}

const SearchInputs = ({
  query,
  country,
  onQueryChange,
  onCountryChange,
  isProcessing,
  countries,
}: SearchInputsProps) => {
  return (
    <div className="flex gap-2">
      <Input
        type="text"
        placeholder="Enter niche (e.g., 'SaaS companies')"
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        className="flex-1"
      />
      <Select value={country} onValueChange={onCountryChange}>
        <SelectTrigger className="w-1/3">
          <SelectValue placeholder="Select country" />
        </SelectTrigger>
        <SelectContent>
          {countries.map((country) => (
            <SelectItem key={country} value={country}>
              {country}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button type="submit" disabled={isProcessing}>
        <Search className="w-4 h-4 mr-2" />
        Search
      </Button>
    </div>
  );
};

export default SearchInputs;