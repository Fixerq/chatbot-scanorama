
import React from 'react';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface BatchProgressProps {
  totalUrls: number;
  processedUrls: number;
  status?: 'pending' | 'processing' | 'completed' | 'failed';
  error?: string | null;
}

const BatchProgress: React.FC<BatchProgressProps> = ({ 
  totalUrls, 
  processedUrls, 
  status, 
  error 
}) => {
  const progress = totalUrls ? Math.round((processedUrls / totalUrls) * 100) : 0;

  return (
    <div className="w-full space-y-4">
      <div className="flex justify-between items-center">
        <span className="text-sm text-muted-foreground">
          Analyzing websites... {processedUrls} of {totalUrls}
        </span>
        <span className="text-sm font-medium">{progress}%</span>
      </div>
      
      <Progress value={progress} className="h-2" />
      
      {status === 'processing' && (
        <p className="text-sm text-muted-foreground animate-pulse">
          This may take a few moments
        </p>
      )}

      {status === 'completed' && (
        <Alert className="bg-green-50 border-green-200">
          <AlertDescription>
            Analysis completed successfully
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertDescription>
            {error}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default BatchProgress;
