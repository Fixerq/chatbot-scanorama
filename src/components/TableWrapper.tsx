
import React, { useEffect, useRef } from 'react';
import { debounce } from 'lodash';

interface TableWrapperProps {
  children: React.ReactNode;
}

const TableWrapper: React.FC<TableWrapperProps> = ({ children }) => {
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!wrapperRef.current) return;

    const resizeObserver = new ResizeObserver(
      debounce((entries) => {
        for (const entry of entries) {
          if (entry.target === wrapperRef.current) {
            // Handle resize if needed
            console.log('Table resized');
          }
        }
      }, 100)
    );

    resizeObserver.observe(wrapperRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  return <div ref={wrapperRef}>{children}</div>;
};

export default TableWrapper;
