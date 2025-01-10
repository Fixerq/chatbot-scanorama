import React from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";

interface EmptyResultsProps {
  onNewSearch: () => void;
}

const EmptyResults = ({ onNewSearch }: EmptyResultsProps) => {
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
          onClick={onNewSearch} 
          className="mt-4 border-cyan-500/20 text-cyan-100 hover:bg-cyan-500/20 rounded-full transition-all duration-300"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Try New Search
        </Button>
      </AlertDescription>
    </Alert>
  );
};

export default EmptyResults;