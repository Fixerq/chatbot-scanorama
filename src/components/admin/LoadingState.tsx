import { Loader2 } from "lucide-react";

export const LoadingState = () => {
  return (
    <div className="flex items-center justify-center p-8">
      <Loader2 className="h-8 w-8 animate-spin" />
      <span className="ml-2">Loading customer data...</span>
    </div>
  );
};