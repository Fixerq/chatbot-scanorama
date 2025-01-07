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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, Search, FileText } from 'lucide-react';

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

  const handleNewSearch = () => {
    clearResults();
    const tabsList = document.querySelector('[role="tablist"]') as HTMLElement;
    if (tabsList) {
      const searchTab = tabsList.querySelector('[value="search"]') as HTMLElement;
      if (searchTab) {
        searchTab.click();
      }
    }
    toast.success('Ready for a new search');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <Header />
        
        <div className="space-y-8 animate-fade-in">
          <Tabs defaultValue="upload" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="upload" className="space-x-2">
                <Upload className="w-4 h-4" />
                <span>Upload CSV</span>
              </TabsTrigger>
              <TabsTrigger value="search" className="space-x-2">
                <Search className="w-4 h-4" />
                <span>Search Websites</span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="upload" className="space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-600" />
                    Bulk URL Analysis
                  </CardTitle>
                  <CardDescription>
                    Upload a CSV file containing multiple URLs to analyze their chatbot implementations in bulk.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <CsvInstructions />
                  <FileUpload onFileAccepted={handleFileAccepted} />
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="search" className="space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Search className="w-5 h-5 text-blue-600" />
                    Website Search
                  </CardTitle>
                  <CardDescription>
                    Search for websites by industry or niche to analyze their chatbot implementations.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <SearchFormContainer 
                    onResults={processSearchResults} 
                    isProcessing={isProcessing} 
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
          
          {isProcessing && (
            <Card>
              <CardContent className="py-6">
                <ProcessingIndicator />
              </CardContent>
            </Card>
          )}

          {results.length > 0 && (
            <Card className="overflow-hidden">
              <CardContent className="p-6">
                <Results 
                  results={results} 
                  onExport={() => exportToCSV(results)}
                  onNewSearch={handleNewSearch}
                />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;