
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatChatbotProviders, getBusinessName } from '@/utils/analysisFormatter';
import ResultUrlCell from './results/ResultUrlCell';
import ResultStatusCell from './results/ResultStatusCell';

export interface Result {
  url: string;
  businessName?: string;
  details?: {
    business_name?: string;
    website_url?: string;
    address?: string;
    placeId?: string;
    businessType?: string;
    title?: string;
    description?: string;
    error?: string;
  };
  status?: string;
  nextPageToken?: string;
  lastChecked?: string;
  error?: string;
}

interface ResultsTableProps {
  results: Result[];
  isLoading?: boolean;
}

const ResultsTable: React.FC<ResultsTableProps> = ({
  results,
  isLoading
}) => {
  const validResults = results.filter(result => {
    return result && result.url && !result.error;
  });

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[300px]">Website</TableHead>
            <TableHead>Business Name</TableHead>
            <TableHead>Address</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {validResults.map((result, index) => {
            try {
              const websiteUrl = result.details?.website_url || result.url;
              const businessName = getBusinessName(websiteUrl, result.businessName || result.details?.business_name);
              
              return (
                <TableRow key={`${websiteUrl}-${index}`} className={isLoading ? 'opacity-50' : ''}>
                  <ResultUrlCell url={websiteUrl} />
                  <TableCell className="font-medium">
                    {businessName}
                  </TableCell>
                  <TableCell>
                    {result.details?.address || 'N/A'}
                  </TableCell>
                </TableRow>
              );
            } catch (error) {
              console.error('Error rendering result row:', error);
              return null;
            }
          }).filter(Boolean)}
        </TableBody>
      </Table>
    </div>
  );
};

export default ResultsTable;
