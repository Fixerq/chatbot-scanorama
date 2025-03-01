
import React from 'react';

const ResultsAnalyzingState = () => {
  return (
    <div className="mt-12 p-8 rounded-[1.25rem] overflow-hidden bg-black/20 border border-white/10 text-center">
      <div className="animate-pulse space-y-4">
        <div className="h-4 bg-cyan-500/20 rounded w-3/4 mx-auto"></div>
        <div className="h-4 bg-cyan-500/20 rounded w-1/2 mx-auto"></div>
        <div className="h-4 bg-cyan-500/20 rounded w-5/6 mx-auto"></div>
      </div>
      <p className="text-cyan-100 mt-4">Searching and analyzing websites...</p>
    </div>
  );
};

export default ResultsAnalyzingState;
