
import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export const LoadingSpinner = () => {
  const [showTimeout, setShowTimeout] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowTimeout(true);
    }, 10000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 animate-fade-in bg-gradient-to-br from-[#0a192f] via-[#0d1f3a] to-[#0a192f]">
      <Loader2 className="h-8 w-8 animate-spin text-[#0FA0CE]" />
      <p className="mt-4 text-muted-foreground">Authenticating...</p>
      {showTimeout && (
        <Alert variant="destructive" className="mt-4 max-w-md">
          <AlertDescription>
            Authentication is taking longer than expected. Please try refreshing the page or signing in again.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};
