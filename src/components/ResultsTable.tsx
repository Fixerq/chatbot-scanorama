
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
    title?: string;
    description?: string;
    lastChecked?: string;
    chatSolutions?: string[];
    website_url?: string | null;
    address?: string;
    businessType?: string;
    phoneNumber?: string;
    placeId?: string;
    fullDetails?: {
      business_name?: string;
      website_url?: string;
    };
  };
  status?: string;
}

interface ResultsTableProps {
  results: Result[];
}

const getBusinessName = (result: Result): string => {
  // Log data before processing for debugging
  console.log('Processing business name for result:', {
    businessName: result.businessName,
    fullDetails: result.details?.fullDetails,
    details: result.details
  });

  // Try different possible locations of the business name
  const name = 
    result.businessName || // Direct property
    result.details?.fullDetails?.business_name || // In fullDetails
    result.details?.business_name || // In details
    'N/A';

  // Log the final resolved name
  console.log('Resolved business name:', name);

  return name;
};

const getDisplayUrl = (result: Result): string => {
  return result.details?.website_url || 
         result.details?.fullDetails?.website_url || 
         result.url;
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
            const displayUrl = getDisplayUrl(result);
            const businessName = getBusinessName(result);
            
            console.log('Rendering row:', {
              index,
              url: displayUrl,
              businessName,
              hasDetails: !!result.details,
              fullResult: result
            });

            return (
              <TableRow key={index}>
                <ResultUrlCell url={displayUrl} />
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
