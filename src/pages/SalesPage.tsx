import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Rocket, Search, BarChart3, Users, Globe, Target } from 'lucide-react';
import Header from '@/components/Header';

const SalesPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <Header />
        
        <div className="space-y-16 pb-16 animate-fade-in">
          {/* Features Section */}
          <section className="space-y-8">
            <h2 className="text-3xl font-bold text-center text-white mb-8">
              Transform Your Sales Process
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="bg-black/60 backdrop-blur-lg border-cyan-500/20 hover:border-cyan-500/40 transition-all duration-300">
                <CardContent className="p-6 space-y-4">
                  <div className="rounded-full bg-cyan-500/10 w-12 h-12 flex items-center justify-center">
                    <Search className="w-6 h-6 text-cyan-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-white">Local Business Discovery</h3>
                  <p className="text-gray-300">Identify businesses in any location and receive a curated list of URLs.</p>
                </CardContent>
              </Card>

              <Card className="bg-black/60 backdrop-blur-lg border-cyan-500/20 hover:border-cyan-500/40 transition-all duration-300">
                <CardContent className="p-6 space-y-4">
                  <div className="rounded-full bg-cyan-500/10 w-12 h-12 flex items-center justify-center">
                    <BarChart3 className="w-6 h-6 text-cyan-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-white">Website Analysis</h3>
                  <p className="text-gray-300">Detect and analyze chatbot technologies on each site with precision.</p>
                </CardContent>
              </Card>

              <Card className="bg-black/60 backdrop-blur-lg border-cyan-500/20 hover:border-cyan-500/40 transition-all duration-300">
                <CardContent className="p-6 space-y-4">
                  <div className="rounded-full bg-cyan-500/10 w-12 h-12 flex items-center justify-center">
                    <Rocket className="w-6 h-6 text-cyan-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-white">AI-Driven Insights</h3>
                  <p className="text-gray-300">Gain deep understanding of chatbot integrations to tailor your strategy.</p>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Benefits Section */}
          <section className="space-y-8">
            <h2 className="text-3xl font-bold text-center text-white mb-8">
              Why Choose Detectify?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="flex gap-4 items-start">
                <div className="rounded-full bg-cyan-500/10 p-3 mt-1">
                  <Target className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">Precision Targeting</h3>
                  <p className="text-gray-300">Identify and analyze potential customers with unmatched accuracy, saving time and resources.</p>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <div className="rounded-full bg-cyan-500/10 p-3 mt-1">
                  <Globe className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">Global Reach</h3>
                  <p className="text-gray-300">Discover opportunities worldwide with our comprehensive business discovery tools.</p>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <div className="rounded-full bg-cyan-500/10 p-3 mt-1">
                  <Users className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">Team Empowerment</h3>
                  <p className="text-gray-300">Equip your sales team with data-driven insights for more effective outreach.</p>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <div className="rounded-full bg-cyan-500/10 p-3 mt-1">
                  <BarChart3 className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">Actionable Analytics</h3>
                  <p className="text-gray-300">Transform raw data into strategic insights that drive conversions.</p>
                </div>
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section className="text-center space-y-6">
            <h2 className="text-3xl font-bold text-white">
              Ready to Transform Your Prospecting?
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Join forward-thinking companies using Detectify to revolutionize their sales process.
            </p>
            <Button 
              className="bg-cyan-500 hover:bg-cyan-600 text-black font-semibold px-8 py-6 rounded-full text-lg transition-all duration-300 hover:scale-105"
              onClick={() => navigate('/login')}
            >
              Get Started Now
            </Button>
          </section>
        </div>
      </div>
    </div>
  );
};

export default SalesPage;