import FileUpload from "@/components/FileUpload";
import Header from "@/components/Header";
import SearchFormContainer from "@/components/SearchFormContainer";
import Results from "@/components/Results";

const Index = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <FileUpload onFileAccepted={(content) => {
        console.log('File content:', content);
        // Handle the file content here
      }} />
      <Header />
      <SearchFormContainer />
      <Results />
    </div>
  );
};

export default Index;