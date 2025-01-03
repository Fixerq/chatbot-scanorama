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
  details?: {
    chatSolutions?: string[];
    errorDetails?: string;
    lastChecked?: string;
  };
}

interface ResultsTableProps {
  results: Result[];
}

const ResultsTable: React.FC<ResultsTableProps> = ({ results }) => {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[300px]">Website</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {results.map((result, index) => (
            <TableRow key={index}>
              <TableCell className="font-medium">
                <a 
                  href={result.url.startsWith('http') ? result.url : `https://${result.url}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  {result.url}
                </a>
              </TableCell>
              <TableCell>{result.status}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default ResultsTable;