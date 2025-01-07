import React from 'react';

const ProcessingIndicator = () => {
  return (
    <div className="text-center py-8">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
      <p className="text-gray-600">Analyzing URLs...</p>
    </div>
  );
};

export default ProcessingIndicator;