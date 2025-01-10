import React from 'react';
import { Button } from "@/components/ui/button";
import { toast } from 'sonner';

interface SubscriptionHandlerProps {
  onSubscribe: () => Promise<void>;
  isLoading: boolean;
}

const SubscriptionHandler: React.FC<SubscriptionHandlerProps> = ({ onSubscribe, isLoading }) => {
  const handleSubscribe = async () => {
    try {
      await onSubscribe();
    } catch (error) {
      console.error('Subscription error:', error);
      toast.error("Failed to process subscription. Please try again.");
    }
  };

  return (
    <div className="text-center space-y-4">
      <h2 className="text-xl font-semibold">Complete Your Subscription</h2>
      <p className="text-gray-600">Click below to proceed with your subscription</p>
      <Button 
        onClick={handleSubscribe}
        disabled={isLoading}
        className="w-full"
      >
        {isLoading ? "Processing..." : "Subscribe Now"}
      </Button>
    </div>
  );
};

export default SubscriptionHandler;