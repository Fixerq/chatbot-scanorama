
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
  status?: string;
  details?: {
    title?: string;
    description?: string;
    lastChecked?: string;
    chatSolutions?: string[];
    website_url?: string | null;
    business_name?: string;
    placeId?: string;
    address?: string;
    businessType?: string;
    phoneNumber?: string;
  };
}

interface ResultsTableProps {
  results: Result[];
}

const ResultsTable: React.FC<ResultsTableProps> = ({ results }) => {
  const formatInstalledTechnologies = (result: Result) => {
    if (!result.status) return 'Analyzing...';
    if (result.status.toLowerCase().includes('error')) return result.status;
    
    const chatSolutions = result.details?.chatSolutions || [];
    if (chatSolutions.length === 0) return 'No chatbot detected';
    
    return chatSolutions[0];
  };

  const getBusinessName = (result: Result): string => {
    // Log data before processing for debugging
    console.log('Processing business name for result:', {
      hasDetails: !!result.details,
      detailsBusinessName: result.details?.business_name,
      detailsTitle: result.details?.title,
      fullDetails: result.details
    });

    if (!result.details) return 'N/A';

    // Try different possible locations of the business name
    const name = result.details.business_name || result.details.title;

    // Log the final resolved name
    console.log('Resolved business name:', name);

    return name || 'N/A';
  };

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
            const hasChatbot = result.details?.chatSolutions && result.details.chatSolutions.length > 0;
            const technologies = formatInstalledTechnologies(result);
            const displayUrl = result.details?.website_url || result.url;
            const businessName = getBusinessName(result);
            
            console.log('Rendering row:', {
              index,
              url: displayUrl,
              businessName,
              hasDetails: !!result.details,
              fullDetails: result.details
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
