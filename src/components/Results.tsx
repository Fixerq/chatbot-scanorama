import React from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import ResultsTable, { Result } from './ResultsTable';

interface ResultsProps {
  results: Result[];
  onExport: () => void;
}

const Results = ({ results, onExport }: ResultsProps) => {
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={onExport}>
          <Download className="w-4 h-4 mr-2" />
          Export Results
        </Button>
      </div>
      <ResultsTable results={results} />
    </div>
  );
};

export default Results;