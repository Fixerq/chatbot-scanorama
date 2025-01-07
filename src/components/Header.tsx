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
    <div className="space-y-12 mb-12">
      {/* Navigation Bar */}
      <header className="w-full flex justify-between items-center px-6 py-4 bg-[#0d1f3a]/50 rounded-[1.25rem] backdrop-blur-sm border border-cyan-500/20 shadow-lg animate-fade-in">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            className="gap-2 text-cyan-400 hover:text-cyan-300 hover:bg-cyan-400/10 transition-all duration-300"
          >
            <Search size={18} />
            My Searches
          </Button>
          <Button 
            variant="ghost" 
            className="gap-2 text-cyan-400 hover:text-cyan-300 hover:bg-cyan-400/10 transition-all duration-300"
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
            className="gap-2 text-red-400 hover:text-red-300 hover:bg-red-400/10 transition-all duration-300"
          >
            <LogOut size={18} />
            Logout
          </Button>
        </div>
      </header>

      {/* Top Section with Logo and Tagline */}
      <div className="text-center space-y-8 bg-[#0d1f3a]/50 rounded-[1.25rem] backdrop-blur-sm border border-cyan-500/20 p-12 shadow-lg animate-fade-in delay-100">
        <h1 className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-cyan-600 animate-gradient glow-text">
          Detectify
        </h1>
        <p className="text-xl font-medium text-cyan-400 glow-text">
          by EngageAI
        </p>
        <p className="text-lg text-gray-300/90 max-w-3xl mx-auto leading-relaxed bg-[#0d1f3a]/50 backdrop-blur-sm rounded-[1rem] p-6 border border-cyan-500/20">
          The ultimate AI-powered tool for discovering local businesses and analyzing their chatbot
          technologies. Whether you're building a pipeline of potential customers or strategizing how to
          position your conversational AI assistant, Detectify gives you the insights you need—faster and
          smarter.
        </p>
      </div>

      {/* Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in delay-200">
        <div className="bg-[#0d1f3a]/50 rounded-[1.25rem] p-8 space-y-4 backdrop-blur-sm border border-cyan-500/20 hover:border-cyan-500/40 transition-all duration-300 group shadow-lg hover:shadow-cyan-500/5">
          <div className="text-cyan-400 mb-4 p-3 rounded-lg bg-cyan-400/10 inline-block group-hover:scale-110 transition-transform duration-300">
            <Download size={24} className="glow-text" />
          </div>
          <h3 className="text-xl font-semibold text-white glow-text">Local Business Discovery</h3>
          <p className="text-gray-300/90">Identify businesses anywhere</p>
        </div>

        <div className="bg-[#0d1f3a]/50 rounded-[1.25rem] p-8 space-y-4 backdrop-blur-sm border border-cyan-500/20 hover:border-cyan-500/40 transition-all duration-300 group shadow-lg hover:shadow-cyan-500/5">
          <div className="text-cyan-400 mb-4 p-3 rounded-lg bg-cyan-400/10 inline-block group-hover:scale-110 transition-transform duration-300">
            <SearchIcon size={24} className="glow-text" />
          </div>
          <h3 className="text-xl font-semibold text-white glow-text">Website Analysis</h3>
          <p className="text-gray-300/90">Detect chatbot technologies</p>
        </div>

        <div className="bg-[#0d1f3a]/50 rounded-[1.25rem] p-8 space-y-4 backdrop-blur-sm border border-cyan-500/20 hover:border-cyan-500/40 transition-all duration-300 group shadow-lg hover:shadow-cyan-500/5">
          <div className="text-cyan-400 mb-4 p-3 rounded-lg bg-cyan-400/10 inline-block group-hover:scale-110 transition-transform duration-300">
            <LineChart size={24} className="glow-text" />
          </div>
          <h3 className="text-xl font-semibold text-white glow-text">AI-Driven Insights</h3>
          <p className="text-gray-300/90">Data-driven prospecting</p>
        </div>
      </div>
    </div>
  );
};

export default Header;