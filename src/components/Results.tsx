import React from 'react';
import { Button } from '@/components/ui/button';
import { Download, RefreshCw } from 'lucide-react';
import ResultsTable, { Result } from './ResultsTable';
import { Alert, AlertDescription } from "@/components/ui/alert";

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
      <Alert>
        <AlertDescription className="space-y-4">
          <p>No results found. Try:</p>
          <ul className="list-disc pl-4 space-y-2">
            <li>Using more general search terms</li>
            <li>Checking for spelling mistakes</li>
            <li>Removing location-specific terms</li>
            <li>Using different keywords related to your search</li>
          </ul>
          <Button variant="outline" onClick={handleNewSearch} className="mt-4">
            <RefreshCw className="w-4 h-4 mr-2" />
            Try New Search
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Found {results.length} website{results.length !== 1 ? 's' : ''}
        </p>
        <div className="space-x-2">
          <Button variant="outline" onClick={handleNewSearch}>
            <RefreshCw className="w-4 h-4 mr-2" />
            New Search
          </Button>
          <Button onClick={onExport}>
            <Download className="w-4 h-4 mr-2" />
            Export Results
          </Button>
        </div>
      </div>
      <ResultsTable results={results} />
    </div>
  );
};

export default Results;