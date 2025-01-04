import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const Login = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Welcome Card */}
        <Card className="border-none shadow-lg bg-white/90 backdrop-blur-sm">
          <CardHeader className="space-y-4 text-center">
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Welcome to EngageAI
            </CardTitle>
            <CardDescription className="text-gray-600">
              Your AI-powered chatbot detection platform. Sign in to start analyzing websites and discover integrated chat solutions.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-white rounded-lg p-4">
              <Auth
                supabaseClient={supabase}
                appearance={{
                  theme: ThemeSupa,
                  variables: {
                    default: {
                      colors: {
                        brand: '#4F46E5',
                        brandAccent: '#4338CA',
                      },
                    },
                  },
                  className: {
                    container: 'w-full',
                    button: 'w-full px-4 py-2 text-white bg-indigo-600 hover:bg-indigo-700 rounded-md transition-colors duration-200',
                    input: 'w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent',
                    label: 'block text-sm font-medium text-gray-700 mb-1',
                  },
                }}
                theme="default"
                providers={['google']}
              />
            </div>
          </CardContent>
        </Card>

        {/* Features Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
          <Card className="bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg">Quick Analysis</CardTitle>
              <CardDescription>
                Upload CSV files or search websites directly to analyze chat solutions
              </CardDescription>
            </CardHeader>
          </Card>
          
          <Card className="bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg">AI-Powered</CardTitle>
              <CardDescription>
                Advanced detection of popular chat platforms and custom solutions
              </CardDescription>
            </CardHeader>
          </Card>
          
          <Card className="bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg">Detailed Reports</CardTitle>
              <CardDescription>
                Get comprehensive insights about chat implementations
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Login;