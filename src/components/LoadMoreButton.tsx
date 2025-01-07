import React from 'react';
import { Button } from './ui/button';

interface LoadMoreButtonProps {
  onLoadMore: () => void;
  isProcessing: boolean;
}

const LoadMoreButton = ({ onLoadMore, isProcessing }: LoadMoreButtonProps) => {
  return (
    <div className="flex justify-center my-20">
      <Button 
        onClick={onLoadMore}
        disabled={isProcessing}
        variant="outline"
      >
        Load More Results
      </Button>
    </div>
  );
};

export default LoadMoreButton;