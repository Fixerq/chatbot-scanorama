import React from 'react';
import { Button } from '@/components/ui/button';
import { Download, RefreshCw } from 'lucide-react';
import ResultsTable, { Result } from './ResultsTable';
import { Alert, AlertDescription } from "@/components/ui/alert";
import BookmarkButton from './BookmarkButton';

interface ResultsProps {
  results?: Result[];
  onExport: () => void;
  onNewSearch: () => void;
}

const Results = ({ results = [], onExport, onNewSearch }: ResultsProps) => {
  const handleNewSearch = () => {
    onNewSearch();
  };

  if (!results || results.length === 0) {
    return (
      <Alert className="bg-black/20 border-cyan-500/20 text-cyan-100 rounded-[1.25rem] backdrop-blur-sm">
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-cyan-200/70">
          Found {results.length} website{results.length !== 1 ? 's' : ''}
        </p>
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
      <div className="rounded-[1.25rem] overflow-hidden">
        <ResultsTable results={results} />
      </div>
    </div>
  );
};

export default Results;