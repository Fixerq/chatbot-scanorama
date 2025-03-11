
import React from 'react';
import { Result } from '@/components/ResultsTable';
import SearchHeader from './SearchHeader';
import SearchFormWrapper from './SearchFormWrapper';

interface SearchSectionProps {
  onResults: (results: Result[], hasMore: boolean) => void;
  onPartialResults: (partialResults: Result[]) => void;
  onHasMoreChange: (hasMore: boolean) => void;
  isProcessing: boolean;
  setIsProcessing: (processing: boolean) => void;
  triggerNewSearch: boolean;
}

const SearchSection = ({
  onResults,
  onPartialResults,
  onHasMoreChange,
  isProcessing,
  setIsProcessing,
  triggerNewSearch
}: SearchSectionProps) => {
  return (
    <>
      <SearchHeader />
      <SearchFormWrapper
        onResults={onResults}
        onPartialResults={onPartialResults}
        onHasMoreChange={onHasMoreChange}
        isProcessing={isProcessing}
        setIsProcessing={setIsProcessing}
        triggerNewSearch={triggerNewSearch}
      />
    </>
  );
};

export default SearchSection;
