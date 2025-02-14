import React from 'react';
import { Button } from './ui/button';
import { Loader2 } from 'lucide-react';
interface LoadMoreButtonProps {
  onLoadMore: () => void;
  isProcessing: boolean;
}
const LoadMoreButton = ({
  onLoadMore,
  isProcessing
}: LoadMoreButtonProps) => {
  return <div className="flex justify-center my-8">
      <Button onClick={onLoadMore} disabled={isProcessing} variant="outline" className="bg-cyan-500/10 border-cyan-500/20 text-cyan-100 hover:bg-cyan-500/20 rounded-full transition-all duration-300 mx-0 px-[110px] my-[20px]">
        {isProcessing ? <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Loading...
          </> : 'Load More Results'}
      </Button>
    </div>;
};
export default LoadMoreButton;