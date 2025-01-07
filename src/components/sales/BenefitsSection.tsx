import React from 'react';
import { Target, Globe, Users, BarChart3 } from 'lucide-react';

const BenefitsSection = () => {
  const benefits = [
    {
      icon: <Target className="w-5 h-5 text-cyan-400" />,
      title: "Precision Targeting",
      description: "Identify and analyze potential customers with unmatched accuracy, saving time and resources."
    },
    {
      icon: <Globe className="w-5 h-5 text-cyan-400" />,
      title: "Global Reach",
      description: "Discover opportunities worldwide with our comprehensive business discovery tools."
    },
    {
      icon: <Users className="w-5 h-5 text-cyan-400" />,
      title: "Team Empowerment",
      description: "Equip your sales team with data-driven insights for more effective outreach."
    },
    {
      icon: <BarChart3 className="w-5 h-5 text-cyan-400" />,
      title: "Actionable Analytics",
      description: "Transform raw data into strategic insights that drive conversions."
    }
  ];

  return (
    <section className="space-y-8">
      <div className="max-w-3xl mx-auto space-y-6 text-center mb-12">
        <h2 className="text-3xl font-bold text-white">
          Here's the Bottom Line:
        </h2>
        <p className="text-lg text-cyan-100">
          Detectify isn't for everyone. It's for people serious about scaling their pipeline and closing deals faster. If you're tired of guessing and ready to get laser-focused on winning clients, this is your unfair advantage.
        </p>
        <p className="text-lg text-cyan-100">
          Don't overthink it. You either want to grow your business, or you don't. Let Detectify do the heavy lifting so you can focus on selling and scaling.
        </p>
        <p className="text-lg font-semibold text-cyan-400">
          Data wins deals. Detectify gives you the data. The rest is up to you.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {benefits.map((benefit, index) => (
          <div key={index} className="flex gap-4 items-start">
            <div className="rounded-full bg-cyan-500/10 p-3 mt-1">
              {benefit.icon}
            </div>
            <div>
              <h3 className="text-xl font-semibold text-white mb-2">{benefit.title}</h3>
              <p className="text-gray-300">{benefit.description}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default BenefitsSection;