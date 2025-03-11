
import React from 'react';
import { Result } from '@/components/ResultsTable';
import SearchFormContainer from '../SearchFormContainer';

interface SearchFormWrapperProps {
  onResults: (results: Result[]) => void;
  onPartialResults: (partialResults: Result[]) => void;
  onHasMoreChange: (hasMore: boolean) => void;
  isProcessing: boolean;
  setIsProcessing: (processing: boolean) => void;
  triggerNewSearch: boolean;
}

const SearchFormWrapper = ({
  onResults,
  onPartialResults,
  onHasMoreChange,
  isProcessing,
  setIsProcessing,
  triggerNewSearch
}: SearchFormWrapperProps) => {
  return (
    <div id="search-form-container">
      <SearchFormContainer 
        onResults={onResults}
        onPartialResults={onPartialResults}
        onHasMoreChange={onHasMoreChange}
        isProcessing={isProcessing}
        setIsProcessing={setIsProcessing}
        triggerNewSearch={triggerNewSearch}
      />
    </div>
  );
};

export default SearchFormWrapper;
