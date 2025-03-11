
import React from 'react';
import { Result } from '@/components/ResultsTable';
import SearchFormContainer from '../SearchFormContainer';
import Header from '../Header';
import { UserStatusCheck } from '../UserStatusCheck';

interface SearchSectionProps {
  onResults: (results: Result[]) => void;
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
      <Header />
      <div className="mb-4">
        <UserStatusCheck />
      </div>
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
    </>
  );
};

export default SearchSection;
