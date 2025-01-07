import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useSupabaseClient } from "@supabase/auth-helpers-react";

const Header = () => {
  const navigate = useNavigate();
  const supabase = useSupabaseClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  return (
    <div className="relative">
      <Card className="bg-gradient-to-r from-cyan-500 to-blue-500 border-none shadow-xl">
        <CardContent className="pt-12 pb-14 px-8">
          <div className="flex flex-col items-center space-y-10">
            <div className="text-center space-y-6">
              <img 
                src="lovable-uploads/engage-logo.png" 
                alt="EngageAI Logo" 
                className="h-16 mx-auto mb-6"
              />
              <h1 className="text-6xl font-bold text-white animate-fade-in tracking-tight" style={{
                textShadow: `
                  0 0 30px rgba(6, 182, 212, 0.9),
                  0 0 60px rgba(6, 182, 212, 0.6),
                  0 0 110px rgba(6, 182, 212, 0.3)
                `
              }}>
                Detectify
              </h1>
              <p className="text-xl text-cyan-50">
                Discover and analyze chatbot implementations across the web
              </p>
            </div>
            <Button 
              variant="secondary" 
              className="bg-white text-blue-600 hover:bg-blue-50"
              onClick={handleSignOut}
            >
              Sign Out
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Header;