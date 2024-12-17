import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const CsvInstructions = () => {
  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>CSV File Format Instructions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-left">
          <p className="mb-2">Your CSV file should:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Have a header row with a column named "URL"</li>
            <li>Each URL should be on a new line</li>
            <li>URLs must include http:// or https://</li>
            <li>Maximum 100 URLs per file</li>
          </ul>
        </div>
        
        <div className="mt-4">
          <p className="font-medium mb-2">Example CSV format:</p>
          <div className="bg-muted p-4 rounded-md font-mono text-sm">
            URL<br />
            https://example1.com<br />
            https://example2.com<br />
            https://example3.com
          </div>
        </div>
        
        <div className="mt-4 text-sm text-muted-foreground">
          <p>💡 Tip: You can create this file in any spreadsheet software (like Excel or Google Sheets) and export it as CSV.</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default CsvInstructions;