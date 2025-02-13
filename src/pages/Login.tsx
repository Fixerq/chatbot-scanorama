
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useSession } from '@supabase/auth-helpers-react';
import { Link } from 'react-router-dom';
import { LogIn, ArrowRight } from 'lucide-react';
import { useAuthState } from '@/hooks/useAuthState';
import { LoginForm } from '@/components/auth/LoginForm';

const Login = () => {
  const session = useSession();
  const { error, isLoading } = useAuthState();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 animate-fade-in bg-gradient-to-br from-[#0a192f] via-[#0d1f3a] to-[#0a192f]">
      <div className="w-full max-w-md">
        <Card className="card-gradient border-none shadow-xl">
          <CardHeader className="space-y-2 text-center pb-6">
            <div className="flex justify-center">
              <LogIn className="w-12 h-12 text-[#0FA0CE]" />
            </div>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-[#0FA0CE] to-[#0D8CAD] bg-clip-text text-transparent">
              Welcome Back
            </CardTitle>
            <CardDescription className="text-muted-foreground text-lg">
              Sign in to access your dashboard
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <LoginForm error={error} />
            <div className="pt-4 text-center space-y-4">
              <div className="text-sm text-muted-foreground">
                Don't have an account yet?
              </div>
              <Link to="/sales">
                <Button 
                  variant="outline" 
                  className="w-full group hover:bg-[#0FA0CE] hover:text-white transition-all duration-200"
                >
                  View Plans & Sign Up
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;
