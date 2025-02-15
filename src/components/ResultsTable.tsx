import React from 'react';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

export interface Result {
  url: string;
  title?: string;
  description?: string;
  business_name?: string;
  website_url?: string;
  address?: string;
  placeId?: string;
  businessType?: string;
  error?: string;
  details?: {
    search_batch_id: string;
    [key: string]: any;
  };
}

interface ResultsTableProps {
  results: Result[];
  processing: boolean;
}

const ResultsTable = ({ results, processing }: ResultsTableProps) => {
  return (
    <div className="w-full overflow-x-auto">
      <Table>
        <TableCaption>Recent search results.</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">Status</TableHead>
            <TableHead>Title</TableHead>
            <TableHead>URL</TableHead>
            <TableHead>Description</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {results.map((result, i) => (
            <TableRow key={i}>
              <TableCell>
                {result.error ? (
                  <Badge variant="destructive">Error</Badge>
                ) : (
                  <Badge variant="secondary">OK</Badge>
                )}
              </TableCell>
              <TableCell>{result.title}</TableCell>
              <TableCell>
                <a href={result.url} target="_blank" rel="noopener noreferrer" className="underline">
                  {result.url}
                </a>
              </TableCell>
              <TableCell>{result.description}</TableCell>
            </TableRow>
          ))}
          {processing && (
            <TableRow>
              <TableCell colSpan={4} className="text-center">
                Processing...
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default ResultsTable;
