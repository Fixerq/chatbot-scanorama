
import React from 'react';
import { Alert, AlertDescription } from "@/components/ui/alert";

const TableEmptyState = () => {
  return (
    <Alert>
      <AlertDescription>
        No results found. Start a new search to see results here.
      </AlertDescription>
    </Alert>
  );
};

export default TableEmptyState;

