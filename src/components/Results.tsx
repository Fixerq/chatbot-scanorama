import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, RefreshCw } from 'lucide-react';
import ResultsTable, { Result } from './ResultsTable';
import { Alert, AlertDescription } from "@/components/ui/alert";
import BookmarkButton from './BookmarkButton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ResultsProps {
  results?: Result[];
  onExport: () => void;
  onNewSearch: () => void;
}

const Results = ({ results = [], onExport, onNewSearch }: ResultsProps) => {
  const [filteredResults, setFilteredResults] = useState<Result[]>(results);
  const [filterValue, setFilterValue] = useState('all');
  const [sortValue, setSortValue] = useState('name');

  // Update filtered results when main results change
  React.useEffect(() => {
    handleFilter(filterValue);
  }, [results, filterValue]);

  const handleNewSearch = () => {
    onNewSearch();
  };

  const handleFilter = (value: string) => {
    setFilterValue(value);
    let filtered = [...results];

    switch (value) {
      case 'chatbot':
        filtered = results.filter(r => r.details?.chatSolutions && r.details.chatSolutions.length > 0);
        break;
      case 'no-chatbot':
        filtered = results.filter(r => !r.details?.chatSolutions || r.details.chatSolutions.length === 0);
        break;
      default:
        filtered = results;
    }

    // Apply current sort after filtering
    handleSort(sortValue, filtered);
  };

  const handleSort = (value: string, resultsToSort = filteredResults) => {
    setSortValue(value);
    let sorted = [...resultsToSort];

    switch (value) {
      case 'name':
        sorted.sort((a, b) => {
          const nameA = a.details?.title || '';
          const nameB = b.details?.title || '';
          return nameA.localeCompare(nameB);
        });
        break;
      case 'url':
        sorted.sort((a, b) => (a.url || '').localeCompare(b.url || ''));
        break;
      case 'status':
        sorted.sort((a, b) => {
          const statusA = a.status || '';
          const statusB = b.status || '';
          return statusA.localeCompare(statusB);
        });
        break;
    }

    setFilteredResults(sorted);
  };

  if (!results || results.length === 0) {
    return (
      <Alert className="mt-10 bg-black/20 border-cyan-500/20 text-cyan-100 rounded-[1.25rem] backdrop-blur-sm">
        <AlertDescription className="space-y-4">
          <p>No results found. Try:</p>
          <ul className="list-disc pl-4 space-y-2 text-cyan-200/70">
            <li>Using more general search terms</li>
            <li>Checking for spelling mistakes</li>
            <li>Removing location-specific terms</li>
            <li>Using different keywords related to your search</li>
          </ul>
          <Button 
            variant="outline" 
            onClick={handleNewSearch} 
            className="mt-4 border-cyan-500/20 text-cyan-100 hover:bg-cyan-500/20 rounded-full transition-all duration-300"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Try New Search
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  const chatbotCount = results.filter(r => r.details?.chatSolutions?.length > 0).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <p className="text-sm text-cyan-200/70">
            Found {results.length} website{results.length !== 1 ? 's' : ''}
          </p>
          <p className="text-xs text-cyan-300/60">
            {chatbotCount} sites with chatbots detected
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Select 
              value={filterValue} 
              onValueChange={handleFilter}
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
              onValueChange={(value) => handleSort(value)}
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
          <div className="space-x-3">
            <BookmarkButton results={results} />
            <Button 
              variant="outline" 
              onClick={handleNewSearch}
              className="border-cyan-500/20 text-cyan-100 hover:bg-cyan-500/20 rounded-full transition-all duration-300"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              New Search
            </Button>
            <Button 
              onClick={onExport}
              className="bg-cyan-500 text-black hover:bg-cyan-400 glow rounded-full transition-all duration-300"
            >
              <Download className="w-4 h-4 mr-2" />
              Export Results
            </Button>
          </div>
        </div>
      </div>
      <div className="rounded-[1.25rem] overflow-hidden">
        <ResultsTable results={filteredResults} />
      </div>
    </div>
  );
};

export default Results;