import { Crown } from "lucide-react";
import { CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface RegistrationHeaderProps {
  planName: string | null;
}

export const RegistrationHeader = ({ planName }: RegistrationHeaderProps) => {
  return (
    <CardHeader className="space-y-4 text-center pb-8">
      <div className="flex justify-center">
        {planName?.toLowerCase().includes('founder') && (
          <Crown className="w-8 h-8 text-amber-500" />
        )}
      </div>
      <CardTitle className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
        Complete Registration
      </CardTitle>
      <CardDescription className="text-lg text-muted-foreground">
        You selected the {planName}
      </CardDescription>
    </CardHeader>
  );
};