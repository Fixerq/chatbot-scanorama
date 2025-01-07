import React from 'react';
import { Download, Search as SearchIcon, LineChart } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Header = () => {
  return (
    <header className="space-y-12 mb-8">
      {/* Navigation */}
      <nav className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <Button variant="link" className="text-cyan-400 hover:text-cyan-300">
            Dashboard
          </Button>
          <Button variant="link" className="text-cyan-400 hover:text-cyan-300">
            Bookmarks
          </Button>
        </div>
        <div className="flex items-center space-x-4">
          <Button variant="link" className="text-cyan-400 hover:text-cyan-300">
            Settings
          </Button>
          <Button variant="link" className="text-cyan-400 hover:text-cyan-300">
            Help
          </Button>
        </div>
      </nav>

      {/* Top Section with Logo and Tagline */}
      <div className="text-center space-y-6 bg-[#0d1f3a]/50 rounded-lg backdrop-blur-sm border border-cyan-500/10 p-8">
        <h1 className="text-6xl font-bold text-white glow-text bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-cyan-600 animate-gradient">
          Detectify
        </h1>
        <p className="text-xl font-medium text-cyan-400 glow-text">
          by EngageAI
        </p>
        <p className="text-lg text-gray-400/90 max-w-3xl mx-auto leading-relaxed bg-[#0d1f3a]/50 backdrop-blur-sm rounded-lg p-4 border border-cyan-500/10">
          The ultimate AI-powered tool for discovering local businesses and analyzing their chatbot
          technologies. Whether you're building a pipeline of potential customers or strategizing how to
          position your conversational AI assistant, Detectify gives you the insights you need—faster and
          more accurately than ever before.
        </p>
      </div>

      {/* Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#0d1f3a]/50 rounded-xl p-8 space-y-4 backdrop-blur-sm border border-cyan-500/10 hover:border-cyan-500/30 transition-all group">
          <div className="text-cyan-400 mb-4 p-3 rounded-lg bg-cyan-400/10 inline-block group-hover:scale-110 transition-transform">
            <Download size={24} className="glow-text" />
          </div>
          <h3 className="text-xl font-semibold text-white">Business Discovery</h3>
          <p className="text-gray-400/90">Identify businesses anywhere</p>
        </div>

        <div className="bg-[#0d1f3a]/50 rounded-xl p-8 space-y-4 backdrop-blur-sm border border-cyan-500/10 hover:border-cyan-500/30 transition-all group">
          <div className="text-cyan-400 mb-4 p-3 rounded-lg bg-cyan-400/10 inline-block group-hover:scale-110 transition-transform">
            <SearchIcon size={24} className="glow-text" />
          </div>
          <h3 className="text-xl font-semibold text-white">Chatbot Detection</h3>
          <p className="text-gray-400/90">Detect chatbot technologies</p>
        </div>

        <div className="bg-[#0d1f3a]/50 rounded-xl p-8 space-y-4 backdrop-blur-sm border border-cyan-500/10 hover:border-cyan-500/30 transition-all group">
          <div className="text-cyan-400 mb-4 p-3 rounded-lg bg-cyan-400/10 inline-block group-hover:scale-110 transition-transform">
            <LineChart size={24} className="glow-text" />
          </div>
          <h3 className="text-xl font-semibold text-white">Market Analysis</h3>
          <p className="text-gray-400/90">Generate market insights</p>
        </div>
      </div>
    </header>
  );
};

export default Header;