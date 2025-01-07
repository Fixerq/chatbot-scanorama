import React from 'react';
import { Button } from '@/components/ui/button';
import { Download, RefreshCw } from 'lucide-react';
import ResultsTable, { Result } from './ResultsTable';
import { Alert, AlertDescription } from "@/components/ui/alert";
import BookmarkButton from './BookmarkButton';

interface ResultsProps {
  results: Result[];
  onExport: () => void;
  onNewSearch: () => void;
}

const Results = ({ results, onExport, onNewSearch }: ResultsProps) => {
  const handleNewSearch = () => {
    onNewSearch();
  };

  if (results.length === 0) {
    return (
      <Alert className="glass-effect border-purple-500/20 text-gray-800 rounded-[1.25rem]">
        <AlertDescription className="space-y-4">
          <p>No results found. Try:</p>
          <ul className="list-disc pl-4 space-y-2 text-gray-600">
            <li>Using more general search terms</li>
            <li>Checking for spelling mistakes</li>
            <li>Removing location-specific terms</li>
            <li>Using different keywords related to your search</li>
          </ul>
          <Button 
            variant="outline" 
            onClick={handleNewSearch} 
            className="mt-4 border-purple-500/20 text-gray-800 hover:bg-purple-500/20 rounded-full transition-all duration-300"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Try New Search
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          Found {results.length} website{results.length !== 1 ? 's' : ''}
        </p>
        <div className="space-x-3">
          <BookmarkButton results={results} />
          <Button 
            variant="outline" 
            onClick={handleNewSearch}
            className="border-purple-500/20 text-gray-800 hover:bg-purple-500/20 rounded-full transition-all duration-300"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            New Search
          </Button>
          <Button 
            onClick={onExport}
            className="bg-purple-600 text-white hover:bg-purple-700 rounded-full transition-all duration-300"
          >
            <Download className="w-4 h-4 mr-2" />
            Export Results
          </Button>
        </div>
      </div>
      <div className="rounded-[1.25rem] overflow-hidden glass-effect">
        <ResultsTable results={results} />
      </div>
    </div>
  );
};

export default Results;