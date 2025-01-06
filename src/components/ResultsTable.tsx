import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export interface Result {
  url: string;
  status?: string;
  details?: {
    title?: string;
    description?: string;
    lastChecked?: string;
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

  const getChatbotStatusColor = (status: string | undefined) => {
    if (!status) return 'gray';
    if (status.toLowerCase().includes('detected')) return 'green';
    if (status.toLowerCase().includes('error')) return 'red';
    return 'gray';
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[300px]">Website</TableHead>
            <TableHead>Business Name</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Chatbot Status</TableHead>
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
              <TableCell>{result.details?.title || 'N/A'}</TableCell>
              <TableCell>{result.details?.description || 'N/A'}</TableCell>
              <TableCell>
                <Badge 
                  variant="secondary"
                  className={`bg-${getChatbotStatusColor(result.status)}-100 text-${getChatbotStatusColor(result.status)}-800 border-${getChatbotStatusColor(result.status)}-200`}
                >
                  {result.status || 'Pending Analysis'}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default ResultsTable;