import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { toast } from 'sonner';
import SubscriptionManager from './SubscriptionManager';
import { Search, Bookmark, LogOut, Download, LineChart, Search as SearchIcon } from 'lucide-react';

const Header = () => {
  const navigate = useNavigate();
  const supabase = useSupabaseClient();

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      navigate('/login');
      toast.success('Logged out successfully');
    } catch (error) {
      console.error('Error logging out:', error);
      toast.error('Failed to log out');
    }
  };

  return (
    <div className="space-y-8 mb-12">
      {/* Navigation Bar */}
      <header className="w-full flex justify-between items-center px-6 py-4 glass-effect rounded-lg animate-fade-in">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            className="gap-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50 transition-all duration-300"
          >
            <Search size={18} />
            My Searches
          </Button>
          <Button 
            variant="ghost" 
            className="gap-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50 transition-all duration-300"
          >
            <Bookmark size={18} />
            My Bookmarks
          </Button>
        </div>
        <div className="flex items-center gap-4">
          <SubscriptionManager />
          <Button 
            variant="ghost"
            onClick={handleLogout}
            className="gap-2 text-red-500 hover:text-red-600 hover:bg-red-50 transition-all duration-300"
          >
            <LogOut size={18} />
            Logout
          </Button>
        </div>
      </header>

      {/* Top Section with Logo and Tagline */}
      <div className="text-center space-y-6 glass-effect rounded-lg p-12 animate-fade-in delay-100">
        <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-600 to-purple-800 bg-clip-text text-transparent">
          Detectify
        </h1>
        <p className="text-xl font-medium text-purple-600">
          by EngageAI
        </p>
        <p className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed bg-purple-50/50 rounded-lg p-6">
          The ultimate AI-powered tool for discovering local businesses and analyzing their chatbot
          technologies. Whether you're building a pipeline of potential customers or strategizing how to
          position your conversational AI assistant, Detectify gives you the insights you need—faster and
          smarter.
        </p>
      </div>

      {/* Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in delay-200">
        {[
          {
            icon: <Download size={24} />,
            title: "Local Business Discovery",
            description: "Identify businesses anywhere"
          },
          {
            icon: <SearchIcon size={24} />,
            title: "Website Analysis",
            description: "Detect chatbot technologies"
          },
          {
            icon: <LineChart size={24} />,
            title: "AI-Driven Insights",
            description: "Data-driven prospecting"
          }
        ].map((feature, index) => (
          <div key={index} className="glass-effect rounded-lg p-8 space-y-4 card-hover">
            <div className="text-purple-600 mb-4 p-3 rounded-lg bg-purple-50 inline-block transition-transform duration-300 group-hover:scale-110">
              {feature.icon}
            </div>
            <h3 className="text-xl font-semibold text-gray-800">
              {feature.title}
            </h3>
            <p className="text-gray-600">
              {feature.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Header;