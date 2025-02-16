
import React from 'react';
import { Bot, XCircle } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ChatbotBadgeProps {
  hasChatbot: boolean;
  patterns?: Array<{
    type: string;
    pattern: string;
    matched: string;
  }>;
}

const ChatbotBadge = ({ hasChatbot, patterns }: ChatbotBadgeProps) => {
  if (hasChatbot) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <Badge variant="success" className="flex items-center gap-1">
              <Bot className="w-3 h-3" />
              <span>Chatbot Detected</span>
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>A chatbot was found on this website</p>
            {patterns && patterns.length > 0 && (
              <div className="mt-2">
                <p className="font-semibold">Matched Patterns:</p>
                <ul className="text-xs">
                  {patterns.map((pattern, i) => (
                    <li key={i} className="mt-1">
                      <span className="font-medium">{pattern.type}:</span> {pattern.matched}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <Badge variant="secondary" className="flex items-center gap-1">
      <XCircle className="w-3 h-3" />
      <span>No Chatbot Found</span>
    </Badge>
  );
};

export default ChatbotBadge;
