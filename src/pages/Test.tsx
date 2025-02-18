
import React from 'react';
import NavigationBar from '@/components/NavigationBar';
import { TestAnalysis } from '@/components/TestAnalysis';
import { Toaster } from 'sonner';

const Test = () => {
  return (
    <div className="min-h-screen bg-background">
      <NavigationBar />
      <main className="container py-6">
        <h1 className="text-2xl font-bold mb-6">Test Analysis Page</h1>
        <TestAnalysis />
      </main>
      <Toaster />
    </div>
  );
};

export default Test;
