
import React from 'react';
import NavigationBar from '@/components/NavigationBar';
import { TestAnalysis } from '@/components/TestAnalysis';
import { Toaster } from 'sonner';
import { useAdminStatus } from '@/hooks/useAdminStatus';
import { Loader2 } from 'lucide-react';

const Test = () => {
  const { isAdmin, isChecking } = useAdminStatus();

  if (isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Verifying admin access...</span>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

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
