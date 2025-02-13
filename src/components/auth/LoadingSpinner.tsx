
import { Loader2 } from 'lucide-react';

export const LoadingSpinner = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 animate-fade-in bg-gradient-to-br from-[#0a192f] via-[#0d1f3a] to-[#0a192f]">
      <Loader2 className="h-8 w-8 animate-spin text-[#0FA0CE]" />
      <p className="mt-4 text-muted-foreground">Authenticating...</p>
    </div>
  );
};
