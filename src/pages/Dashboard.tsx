
import { SearchInterface } from "@/components/search/SearchInterface";

const Dashboard = () => {
  return (
    <div className="container mx-auto py-8 space-y-8">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-medium mb-6">Business Search</h2>
        <SearchInterface />
      </div>
    </div>
  );
};

export default Dashboard;

