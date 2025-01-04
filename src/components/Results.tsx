import React from 'react';
import { Button } from '@/components/ui/button';
import { Download, RefreshCw } from 'lucide-react';
import ResultsTable, { Result } from './ResultsTable';

interface ResultsProps {
  results: Result[];
  onExport: () => void;
  onNewSearch: () => void;
}

const Results = ({ results, onExport, onNewSearch }: ResultsProps) => {
  const handleNewSearch = () => {
    // Ensure we clear everything before triggering the new search
    onNewSearch();
  };

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