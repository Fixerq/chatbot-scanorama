
import React from 'react';
import { Button } from './ui/button';
import { Loader2 } from 'lucide-react';

interface LoadMoreButtonProps {
  onLoadMore: () => void;
  isProcessing: boolean;
}

const LoadMoreButton = ({ onLoadMore, isProcessing }: LoadMoreButtonProps) => {
  return (
    <Button 
      onClick={onLoadMore}
      disabled={isProcessing}
      size="lg"
      className="bg-cyan-500 hover:bg-cyan-600 text-white font-medium px-8 py-6 rounded-full transition-all duration-300 flex items-center justify-center min-w-[200px] shadow-md"
    >
      {isProcessing ? (
        <>
          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
          Loading...
        </>
      ) : (
        'Load More Results'
      )}
    </Button>
  );
};

export default LoadMoreButton;
