import React from 'react';
import NavigationBar from '@/components/NavigationBar';
import Header from '@/components/Header';
import SearchFormContainer from '@/components/SearchFormContainer';
import Results from '@/components/Results';

const Index = () => {
  return (
    <div className="min-h-screen bg-black">
      <NavigationBar />
      <div className="container py-8">
        <Header />
        <SearchFormContainer />
        <Results />
      </div>
    </div>
  );
};

export default Index;