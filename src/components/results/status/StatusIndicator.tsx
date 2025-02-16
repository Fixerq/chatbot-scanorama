
import React from 'react';
import { Loader2, AlertTriangle, XCircle } from 'lucide-react';

interface StatusIndicatorProps {
  status?: string;
  error?: string;
  lastChecked?: string;
}

const StatusIndicator = ({ status, error, lastChecked }: StatusIndicatorProps) => {
  if (status?.toLowerCase() === 'analyzing...' || status === 'processing') {
    return (
      <div className="flex items-center space-x-2">
        <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
        <span className="text-blue-600 dark:text-blue-400">Analyzing...</span>
      </div>
    );
  }

  if (status === 'queued') {
    return (
      <div className="flex items-center space-x-2">
        <AlertTriangle className="w-4 h-4 text-yellow-500" />
        <span className="text-yellow-600 dark:text-yellow-400">Queued for analysis</span>
      </div>
    );
  }

  if (status === 'failed' || error) {
    return (
      <div className="text-red-500 dark:text-red-400">
        <div className="flex items-center space-x-2">
          <XCircle className="w-4 h-4" />
          <span>{error || status}</span>
        </div>
        {lastChecked && (
          <div className="text-xs text-gray-500 mt-1">
            Last attempt: {new Date(lastChecked).toLocaleString()}
          </div>
        )}
      </div>
    );
  }

  return null;
};

export default StatusIndicator;
