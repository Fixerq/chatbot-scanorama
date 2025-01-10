import React from 'react';
import { RefreshCw, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import BookmarkButton from '../BookmarkButton';
import { Result } from '../ResultsTable';

interface ResultsHeaderProps {
  results: Result[];
  totalCount: number;
  chatbotCount: number;
  onNewSearch: () => void;
  onExport: () => void;
}

const ResultsHeader = ({ 
  results, 
  totalCount, 
  chatbotCount, 
  onNewSearch, 
  onExport 
}: ResultsHeaderProps) => {
  return (
    <div className="flex items-center justify-between">
      <div className="space-y-2">
        <p className="text-sm text-cyan-200/70">
          Found {totalCount} website{totalCount !== 1 ? 's' : ''}
        </p>
        <p className="text-xs text-cyan-300/60">
          {chatbotCount} sites with chatbots detected
        </p>
      </div>
      <div className="space-x-3">
        <BookmarkButton results={results} />
        <Button 
          variant="outline" 
          onClick={onNewSearch}
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
  );
};

export default ResultsHeader;