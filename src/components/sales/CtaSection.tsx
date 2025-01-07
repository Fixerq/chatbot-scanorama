import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";

const CtaSection = () => {
  const navigate = useNavigate();

  return (
    <section className="text-center space-y-6">
      <h2 className="text-3xl font-bold text-white">
        Ready to Transform Your Prospecting?
      </h2>
      <p className="text-xl text-gray-300 max-w-2xl mx-auto">
        Join hundreds of forward-thinking companies using Detectify to revolutionize their sales process.
      </p>
      <div className="space-y-8">
        <Button 
          className="bg-cyan-500 hover:bg-cyan-600 text-black font-semibold px-8 py-6 rounded-full text-lg transition-all duration-300 hover:scale-105"
          onClick={() => navigate('/login')}
        >
          Sign Up and Scale Now
        </Button>
      </div>
    </section>
  );
};

export default CtaSection;