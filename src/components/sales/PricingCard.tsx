import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import PricingFeature from "./PricingFeature";
import { Crown } from "lucide-react";

interface PricingCardProps {
  name: string;
  price: string;
  description: string;
  features: string[];
  priceId: string;
  productId: string;
  popular?: boolean;
  special?: boolean;
  onSubscribe: (priceId: string, productId: string) => void;
  isLoading: boolean;
  hasSubscription: boolean;
}

export const PricingCard = ({
  name,
  price,
  description,
  features,
  priceId,
  productId,
  popular,
  special,
  onSubscribe,
  isLoading,
  hasSubscription
}: PricingCardProps) => {
  const handleClick = () => {
    console.log('Subscribing to plan:', { name, priceId, productId });
    onSubscribe(priceId, productId);
  };

  return (
    <Card className={`relative flex flex-col justify-between ${popular ? 'border-cyan-500 shadow-cyan-500/20 shadow-lg scale-105' : ''}`}>
      {popular && (
        <div className="absolute -top-4 left-0 right-0 flex justify-center">
          <span className="bg-cyan-500 text-white px-3 py-1 rounded-full text-sm font-medium">
            Most Popular
          </span>
        </div>
      )}
      
      <div>
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {special && <Crown className="w-8 h-8 text-amber-500" />}
          </div>
          <h3 className="text-2xl font-bold">{name}</h3>
          <p className="text-3xl font-bold">
            {price}
            <span className="text-base font-normal text-muted-foreground">/mo</span>
          </p>
          <p className="text-sm text-muted-foreground">{description}</p>
        </CardHeader>

        <CardContent className="space-y-4">
          {features.map((feature, index) => (
            <PricingFeature key={index} text={feature} />
          ))}
        </CardContent>
      </div>

      <CardFooter>
        <Button 
          className="w-full" 
          size="lg"
          variant={popular ? "default" : "outline"}
          onClick={handleClick}
          disabled={isLoading || hasSubscription}
        >
          {isLoading ? "Processing..." : "Subscribe Now"}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default PricingCard;