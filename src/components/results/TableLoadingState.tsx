
import React from 'react';

const TableLoadingState = () => {
  return (
    <div className="w-full space-y-4">
      <div className="animate-pulse space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 bg-gray-100/10 rounded"></div>
        ))}
      </div>
    </div>
  );
};

export default TableLoadingState;

