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
    <div className="space-y-12 mb-12">
      {/* Top Section with Logo and Tagline */}
      <div className="text-center space-y-6">
        <h1 className="text-6xl font-bold text-white glow-text bg-clip-text bg-gradient-to-r from-cyan-400 to-cyan-600">
          Detectify
        </h1>
        <p className="text-xl font-medium text-cyan-400">
          by EngageAI
        </p>
        <p className="text-lg text-gray-300 max-w-3xl mx-auto leading-relaxed">
          The ultimate AI-powered tool for discovering local businesses and analyzing their chatbot
          technologies. Whether you're building a pipeline of potential customers or strategizing how to
          position your conversational AI assistant, Detectify gives you the insights you need—faster and
          smarter.
        </p>
      </div>

      {/* Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card-gradient rounded-xl p-6 space-y-3 backdrop-blur-sm border border-cyan-500/10">
          <div className="text-cyan-400 mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M7 10L12 15L17 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 15V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-white">Local Business Discovery</h3>
          <p className="text-gray-300">Identify businesses anywhere</p>
        </div>

        <div className="card-gradient rounded-xl p-6 space-y-3 backdrop-blur-sm border border-cyan-500/10">
          <div className="text-cyan-400 mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M11 19C15.4183 19 19 15.4183 19 11C19 6.58172 15.4183 3 11 3C6.58172 3 3 6.58172 3 11C3 15.4183 6.58172 19 11 19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M21 21L16.65 16.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-white">Website Analysis</h3>
          <p className="text-gray-300">Detect chatbot technologies</p>
        </div>

        <div className="card-gradient rounded-xl p-6 space-y-3 backdrop-blur-sm border border-cyan-500/10">
          <div className="text-cyan-400 mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 20V10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 20V4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M6 20V14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-white">AI-Driven Insights</h3>
          <p className="text-gray-300">Data-driven prospecting</p>
        </div>
      </div>

      {/* Navigation Bar */}
      <header className="w-full flex justify-between items-center px-6 py-3 bg-secondary/50 rounded-lg backdrop-blur-sm border border-cyan-500/10">
        <div className="flex items-center gap-4">
          <Button variant="outline" className="gap-2">
            <Search size={18} />
            My Searches
          </Button>
          <Button variant="outline" className="gap-2">
            <Bookmark size={18} />
            My Bookmarks
          </Button>
        </div>
        <div className="flex items-center gap-4">
          <SubscriptionManager />
          <Button 
            variant="destructive"
            onClick={handleLogout}
            className="gap-2"
          >
            <LogOut size={18} />
            Logout
          </Button>
        </div>
      </header>
    </div>
  );
};

export default Header;