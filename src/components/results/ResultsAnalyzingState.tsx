
import React from 'react';

interface ResultsAnalyzingStateProps {
  isPartial?: boolean;
}

const ResultsAnalyzingState = ({ isPartial = false }: ResultsAnalyzingStateProps) => {
  return (
    <div className={`p-4 rounded-[1.25rem] overflow-hidden ${isPartial ? 'bg-black/10' : 'bg-black/20'} border border-white/10 text-center`}>
      <div className="animate-pulse space-y-2">
        <div className="h-3 bg-cyan-500/20 rounded w-3/4 mx-auto"></div>
        {!isPartial && (
          <>
            <div className="h-3 bg-cyan-500/20 rounded w-1/2 mx-auto"></div>
            <div className="h-3 bg-cyan-500/20 rounded w-5/6 mx-auto"></div>
          </>
        )}
      </div>
      <p className="text-cyan-100 mt-2 text-sm">
        {isPartial ? 
          'Analyzing websites for chatbots (showing search results now)...' : 
          'Loading search results...'}
      </p>
    </div>
  );
};

export default ResultsAnalyzingState;
