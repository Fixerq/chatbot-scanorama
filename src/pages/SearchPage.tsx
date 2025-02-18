
import { SearchInterface } from "@/components/search/SearchInterface";
import { Card } from "@/components/ui/card";

const SearchPage = () => {
  return (
    <div className="container mx-auto p-6">
      <Card className="p-6">
        <h1 className="text-2xl font-bold mb-6">Business Search</h1>
        <SearchInterface />
      </Card>
    </div>
  );
};

export default SearchPage;
