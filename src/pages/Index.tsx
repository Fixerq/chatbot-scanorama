import React from 'react';
import FileUpload from '@/components/FileUpload';
import { processCSV, exportToCSV } from '@/utils/chatbotDetection';
import { toast } from 'sonner';
import CsvInstructions from '@/components/CsvInstructions';
import Header from '@/components/Header';
import Results from '@/components/Results';
import SearchFormContainer from '@/components/SearchFormContainer';
import ProcessingIndicator from '@/components/ProcessingIndicator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUrlProcessor } from '@/hooks/useUrlProcessor';

const Index = () => {
  const { 
    results, 
    isProcessing, 
    processUrls, 
    processSearchResults, 
    clearResults 
  } = useUrlProcessor();

  const handleFileAccepted = async (content: string) => {
    const urls = processCSV(content);
    
    if (urls.length === 0) {
      toast.error('No valid URLs found in the CSV');
      return;
    }

    if (urls.length > 100) {
      toast.error('Please limit your CSV to 100 URLs or less');
      return;
    }

    await processUrls(urls);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <Header />
        
        <div className="space-y-8 animate-fade-in">
          <Tabs defaultValue="upload" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="upload">Upload CSV</TabsTrigger>
              <TabsTrigger value="search">Search Websites</TabsTrigger>
            </TabsList>
            
            <TabsContent value="upload" className="space-y-8">
              <CsvInstructions />
              <FileUpload onFileAccepted={handleFileAccepted} />
            </TabsContent>
            
            <TabsContent value="search" className="space-y-8">
              <div className="prose dark:prose-invert max-w-none">
                <h3>Search Websites by Niche</h3>
                <p>Enter a niche or industry to find and analyze websites for chatbot usage.</p>
              </div>
              <SearchFormContainer 
                onResults={processSearchResults} 
                isProcessing={isProcessing} 
              />
            </TabsContent>
          </Tabs>
          
          {isProcessing && <ProcessingIndicator />}

          {results.length > 0 && (
            <Results 
              results={results} 
              onExport={() => exportToCSV(results)}
              onNewSearch={clearResults}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;