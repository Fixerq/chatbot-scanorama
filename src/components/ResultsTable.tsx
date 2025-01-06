import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export interface Result {
  url: string;
  status: string;
  phone?: string;
  details?: {
    chatSolutions?: string[];
    errorDetails?: string;
    lastChecked?: string;
    title?: string;
    description?: string;
  };
}

interface ResultsTableProps {
  results: Result[];
}

const ResultsTable: React.FC<ResultsTableProps> = ({ results }) => {
  const formatUrl = (url: string) => {
    if (!url) return 'N/A';
    return url.startsWith('http') ? url : `https://${url}`;
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[300px]">Website</TableHead>
            <TableHead className="w-[150px]">Phone</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {results.map((result, index) => (
            <TableRow key={index}>
              <TableCell className="font-medium">
                {result.url ? (
                  <a 
                    href={formatUrl(result.url)}
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    {result.url}
                  </a>
                ) : (
                  <span className="text-gray-500">N/A</span>
                )}
              </TableCell>
              <TableCell>{result.phone || 'N/A'}</TableCell>
              <TableCell>{result.status || 'Pending'}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default ResultsTable;