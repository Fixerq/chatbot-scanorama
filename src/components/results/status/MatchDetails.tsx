
import React from 'react';
import { Badge } from "@/components/ui/badge";

interface MatchDetailsProps {
  chatSolutions: string[];
  lastChecked?: string;
}

const MatchDetails = ({ chatSolutions, lastChecked }: MatchDetailsProps) => {
  return (
    <>
      {chatSolutions && chatSolutions.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {chatSolutions.map((solution, index) => (
            <Badge key={index} variant="outline" className="text-xs">
              {solution}
            </Badge>
          ))}
        </div>
      )}
      
      {lastChecked && (
        <div className="text-xs text-gray-500">
          Last checked: {new Date(lastChecked).toLocaleString()}
        </div>
      )}
    </>
  );
};

export default MatchDetails;
