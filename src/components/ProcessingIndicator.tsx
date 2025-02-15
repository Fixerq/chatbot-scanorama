
import React from 'react';
import { Loader2 } from "lucide-react";

const ProcessingIndicator = () => {
  return (
    <div className="flex items-center justify-center p-4">
      <Loader2 className="h-6 w-6 animate-spin" />
    </div>
  );
};

export default ProcessingIndicator;
