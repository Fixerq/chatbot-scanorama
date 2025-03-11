
import React from 'react';
import NavigationBar from '../NavigationBar';

interface DashboardContainerProps {
  children: React.ReactNode;
}

const DashboardContainer = ({ children }: DashboardContainerProps) => {
  return (
    <div className="min-h-screen bg-black">
      <NavigationBar />
      <div className="container py-8">
        {children}
      </div>
    </div>
  );
};

export default DashboardContainer;
