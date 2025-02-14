
import React from 'react';
import { TableCell } from "@/components/ui/table";
import { formatUrl } from '@/utils/urlFormatting';

interface ResultUrlCellProps {
  url: string;
}

const ResultUrlCell = ({ url }: ResultUrlCellProps) => {
  // Try to get the business website URL from the details
  const businessUrl = url?.startsWith('http') ? url : null;
  
  if (!businessUrl) {
    return (
      <TableCell className="font-medium">
        <span className="text-gray-500">No website found</span>
      </TableCell>
    );
  }

  const { displayUrl, fullUrl } = formatUrl(businessUrl);

  return (
    <TableCell className="font-medium">
      <a 
        href={fullUrl}
        target="_blank" 
        rel="noopener noreferrer"
        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 truncate max-w-[300px] inline-block"
        title={fullUrl}
      >
        {displayUrl}
      </a>
    </TableCell>
  );
};

export default ResultUrlCell;
