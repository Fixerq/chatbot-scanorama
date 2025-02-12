
import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import ResultUrlCell from './results/ResultUrlCell';
import ResultStatusCell from './results/ResultStatusCell';

export interface Result {
  url: string;
  businessName?: string;  
  details?: {
    business_name?: string;
    website_url?: string;
    lastChecked?: string;
    chatSolutions?: string[];
    address?: string;
    placeId?: string;
    businessType?: string;
    maps_url?: string;
    title?: string;
    description?: string;
  };
  status?: string;
}

interface ResultsTableProps {
  results: Result[];
}

const getDisplayUrl = (result: Result): string => {
  // Try to get the actual website URL
  const websiteUrl = result.url || result.details?.website_url;
  
  // If no website URL is available, fall back to maps URL
  return websiteUrl || result.details?.maps_url || 'N/A';
};

const getBusinessName = (result: Result): string => {
  // Log the incoming data
  console.log('Processing result:', result);

  // Extract business name from the result
  const businessName = result.businessName || // Try root level first
                      result.details?.business_name || // Then try details
                      'N/A'; // Fallback if no name found

  console.log('Resolved business name:', businessName);
  return businessName;
};

const formatInstalledTechnologies = (result: Result) => {
  if (!result.status) return 'Analyzing...';
  if (result.status.toLowerCase().includes('error')) return result.status;
  
  const chatSolutions = result.details?.chatSolutions || [];
  if (chatSolutions.length === 0) return 'No chatbot detected';
  
  return chatSolutions[0];
};

const ResultsTable: React.FC<ResultsTableProps> = ({ results }) => {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[300px]">Website</TableHead>
            <TableHead>Business Name</TableHead>
            <TableHead>Chatbot Provider</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {results.map((result, index) => {
            console.log('Raw result data:', JSON.stringify(result, null, 2));
            
            const hasChatbot = result.details?.chatSolutions && result.details.chatSolutions.length > 0;
            const technologies = formatInstalledTechnologies(result);
            const businessName = getBusinessName(result);
            const displayUrl = getDisplayUrl(result);
            
            console.log('Rendering row:', {
              index,
              url: displayUrl,
              businessName,
              hasDetails: !!result.details,
              fullResult: result
            });

            return (
              <TableRow key={index}>
                <TableCell>
                  <a 
                    href={displayUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:text-blue-700 underline"
                  >
                    {displayUrl}
                  </a>
                </TableCell>
                <TableCell className="font-medium">
                  {businessName}
                </TableCell>
                <ResultStatusCell 
                  status={result.status}
                  hasChatbot={hasChatbot}
                  technologies={technologies}
                  lastChecked={result.details?.lastChecked}
                  chatSolutions={result.details?.chatSolutions}
                />
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};

export default ResultsTable;
