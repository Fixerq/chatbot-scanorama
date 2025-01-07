import FileUpload from "@/components/FileUpload"; // Fixed import
import Header from "@/components/Header";
import SearchFormContainer from "@/components/SearchFormContainer";
import Results from "@/components/Results";
import { useState } from "react";
import { Result } from "@/components/ResultsTable";

const Index = () => {
  const [results, setResults] = useState<Result[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleExport = () => {
    // Handle export functionality
    console.log("Exporting results...");
  };

  const handleNewSearch = () => {
    setResults([]);
  };

  const handleFileAccepted = (content: string) => {
    console.log("File content received:", content);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <FileUpload onFileAccepted={handleFileAccepted} />
      <Header />
      <SearchFormContainer 
        onResults={setResults}
        isProcessing={isProcessing}
      />
      <Results 
        results={results}
        onExport={handleExport}
        onNewSearch={handleNewSearch}
      />
    </div>
  );
};

export default Index;