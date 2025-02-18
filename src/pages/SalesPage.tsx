
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import BenefitsSection from "@/components/sales/BenefitsSection";
import FeaturesSection from "@/components/sales/FeaturesSection";
import PricingSection from "@/components/sales/PricingSection";
import Header from "@/components/Header";

const SalesPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a192f] via-[#0d1f3a] to-[#0a192f]">
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center justify-between">
          <div className="mr-4 flex">
            <Link to="/" className="mr-6 flex items-center space-x-2">
              <span className="hidden font-bold sm:inline-block">
                Detectify
              </span>
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/login">
              <Button variant="ghost" size="sm">
                Login
              </Button>
            </Link>
          </div>
        </div>
      </nav>
      
      <div className="container py-8">
        <Header />
        <BenefitsSection />
        <FeaturesSection />
        <PricingSection />
      </div>
    </div>
  );
};

export default SalesPage;
