import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { toast } from 'sonner';
import SubscriptionManager from './SubscriptionManager';
import { Search, Bookmark, LogOut } from 'lucide-react';

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
      <header className="w-full flex justify-between items-center px-6 py-4 glass-effect rounded-2xl animate-fade-in">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            className="gap-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-all duration-300"
          >
            <Search size={18} />
            My Searches
          </Button>
          <Button 
            variant="ghost" 
            className="gap-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-all duration-300"
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

      <div className="text-center space-y-6 glass-effect rounded-2xl p-12 animate-fade-in delay-100">
        <h1 className="text-5xl font-bold text-gray-900">
          Detectify
        </h1>
        <p className="text-xl font-medium text-gray-600">
          by EngageAI
        </p>
        <p className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
          The ultimate AI-powered tool for discovering local businesses and analyzing their chatbot
          technologies. Whether you're building a pipeline of potential customers or strategizing how to
          position your conversational AI assistant, Detectify gives you the insights you need—faster and
          smarter.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in delay-200">
        {[
          {
            icon: <Search size={24} />,
            title: "Local Business Discovery",
            description: "Identify businesses anywhere"
          },
          {
            icon: <Search size={24} />,
            title: "Website Analysis",
            description: "Detect chatbot technologies"
          },
          {
            icon: <Search size={24} />,
            title: "AI-Driven Insights",
            description: "Data-driven prospecting"
          }
        ].map((feature, index) => (
          <div key={index} className="glass-effect rounded-2xl p-8 space-y-4 card-hover">
            <div className="text-gray-900 mb-4 p-3 rounded-xl bg-gray-50 inline-block">
              {feature.icon}
            </div>
            <h3 className="text-xl font-semibold text-gray-900">
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