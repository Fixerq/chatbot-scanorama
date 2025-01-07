import React from 'react';
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Mail } from "lucide-react";

interface EmailResultsProps {
  emails: string[];
}

const EmailResults = ({ emails }: EmailResultsProps) => {
  if (!emails || emails.length === 0) {
    return (
      <Alert className="mt-4">
        <AlertDescription>
          No email addresses were found on this website.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card className="mt-4 p-4">
      <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
        <Mail className="w-4 h-4" />
        Found Emails ({emails.length})
      </h3>
      <ScrollArea className="h-[200px] rounded-md border p-4">
        <ul className="space-y-2">
          {emails.map((email, index) => (
            <li 
              key={index}
              className="flex items-center gap-2 p-2 hover:bg-accent rounded-md transition-colors"
            >
              <Mail className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm">{email}</span>
            </li>
          ))}
        </ul>
      </ScrollArea>
    </Card>
  );
};

export default EmailResults;