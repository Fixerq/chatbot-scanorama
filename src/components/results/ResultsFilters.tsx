import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ResultsFiltersProps {
  filterValue: string;
  sortValue: string;
  onFilterChange: (value: string) => void;
  onSortChange: (value: string) => void;
}

const ResultsFilters = ({
  filterValue,
  sortValue,
  onFilterChange,
  onSortChange
}: ResultsFiltersProps) => {
  return (
    <div className="flex items-center gap-2">
      <Select 
        value={filterValue} 
        onValueChange={onFilterChange}
      >
        <SelectTrigger className="w-[140px] h-9 border-cyan-500/20 text-cyan-100 bg-black/20">
          <SelectValue placeholder="Filter by" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Results</SelectItem>
          <SelectItem value="chatbot">With Chatbot</SelectItem>
          <SelectItem value="no-chatbot">No Chatbot</SelectItem>
        </SelectContent>
      </Select>
      <Select 
        value={sortValue} 
        onValueChange={onSortChange}
      >
        <SelectTrigger className="w-[140px] h-9 border-cyan-500/20 text-cyan-100 bg-black/20">
          <SelectValue placeholder="Sort by" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="name">Business Name</SelectItem>
          <SelectItem value="url">URL</SelectItem>
          <SelectItem value="status">Status</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};

export default ResultsFilters;