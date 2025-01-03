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
  status: string;
  technologies?: string[];
}

interface ResultsTableProps {
  results: Result[];
}

const ResultsTable = ({ results }: ResultsTableProps) => {
  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>URL</TableHead>
            <TableHead>Detection Status</TableHead>
            <TableHead>Technologies</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {results.map((result, index) => (
            <TableRow key={index}>
              <TableCell className="font-medium">{result.url}</TableCell>
              <TableCell>
                <span className={`inline-flex items-center ${
                  result.status.includes('detected') ? 'text-green-600' : 
                  result.status.includes('Error') ? 'text-red-600' : 'text-gray-600'
                }`}>
                  {result.status}
                </span>
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {result.technologies?.map((tech, i) => (
                    <Badge key={i} variant="secondary">
                      {tech}
                    </Badge>
                  ))}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default ResultsTable;