import React from 'react';
import { Card } from "@/components/ui/card";
import { Search, Database, Send } from 'lucide-react';

const BenefitsSection = () => {
  return (
    <section className="relative py-12">
      <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/5 via-transparent to-cyan-500/5 blur-xl" />
      
      <div className="relative space-y-16">
        <Card className="relative max-w-3xl mx-auto space-y-8 p-8 bg-black/40 backdrop-blur-lg border-cyan-500/20">
          <h2 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-cyan-200 animate-gradient">
            How It Works
          </h2>
          
          <div className="grid gap-8">
            <div className="flex items-center gap-6 animate-fade-in delay-100">
              <div className="rounded-full bg-cyan-500/10 p-4">
                <Search className="w-8 h-8 text-cyan-400" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white mb-2">1. Search by industry or niche</h3>
                <p className="text-cyan-50">
                  Enter your target market and location to discover potential clients.
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-6 animate-fade-in delay-200">
              <div className="rounded-full bg-cyan-500/10 p-4">
                <Database className="w-8 h-8 text-cyan-400" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white mb-2">2. Analyze website chat technologies</h3>
                <p className="text-cyan-50">
                  Our AI scans and identifies existing chatbot implementations.
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-6 animate-fade-in delay-300">
              <div className="rounded-full bg-cyan-500/10 p-4">
                <Send className="w-8 h-8 text-cyan-400" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white mb-2">3. Download actionable data</h3>
                <p className="text-cyan-50">
                  Get detailed reports and insights for smarter outreach.
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
};

export default BenefitsSection;