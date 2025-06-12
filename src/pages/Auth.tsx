
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Eye, EyeOff, Star, BarChart3, TrendingUp, FileText, Mail } from "lucide-react";

const Auth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        // Login
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;
        
        toast({
          title: "Login successful",
          description: "Redirecting to dashboard...",
        });
        navigate("/dashboard");
      } else {
        // Sign up
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) throw error;
        
        toast({
          title: "Sign up successful",
          description: "Please check your email for verification instructions or log in if verification is not required.",
        });
        setIsLogin(true);
      }
    } catch (error: any) {
      toast({
        title: "Authentication error",
        description: error.message || "An error occurred during authentication",
        variant: "destructive",
      });
      console.error("Auth error:", error);
    } finally {
      setLoading(false);
    }
  };

  const features = [
    {
      icon: BarChart3,
      title: "Analyze Reviews",
      description: "Track Google Maps reviews in real-time"
    },
    {
      icon: TrendingUp,
      title: "Sentiment Analysis",
      description: "Understand customer sentiment trends"
    },
    {
      icon: Star,
      title: "AI Insights",
      description: "Get AI-powered recommendations"
    },
    {
      icon: FileText,
      title: "Export Reports",
      description: "Generate professional PDF reports"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800 flex flex-col animate-fade-in">
      {/* Mobile-optimized container */}
      <div className="flex-1 flex flex-col justify-center p-4 sm:p-6 lg:p-8">
        <div className="mx-auto w-full max-w-sm sm:max-w-md">
          {/* Logo/Header */}
          <div className="text-center mb-6 sm:mb-8">
            <div className="flex justify-center mb-4">
              <div className="bg-blue-100 dark:bg-blue-900/30 p-3 sm:p-4 rounded-full">
                <Star className="h-8 w-8 sm:h-10 sm:w-10 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Star Gazer Analysis
            </h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
              {isLogin ? "Welcome back" : "Get started today"}
            </p>
          </div>

          <Card className="border-0 shadow-lg dark:bg-gray-800">
            <CardContent className="p-6 sm:p-8">
              <form
                onSubmit={handleSubmit}
                className="space-y-5 sm:space-y-6"
              >
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm sm:text-base">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="dark:bg-gray-700 h-12 text-base tap-highlight-transparent"
                    required
                    autoComplete="email"
                    autoCapitalize="off"
                    autoCorrect="off"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm sm:text-base">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder={isLogin ? "Your password" : "Create a password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="dark:bg-gray-700 pr-12 h-12 text-base tap-highlight-transparent"
                      required
                      minLength={6}
                      autoComplete={isLogin ? "current-password" : "new-password"}
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center min-h-touch tap-highlight-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
                      ) : (
                        <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
                      )}
                    </button>
                  </div>
                  {!isLogin && (
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                      Password must be at least 6 characters
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 h-12 text-base font-medium tap-highlight-transparent"
                  disabled={loading || !email || !password}
                >
                  {loading ? "Processing..." : isLogin ? "Log in" : "Sign up"}
                </Button>
              </form>
              
              <div className="mt-6 text-center">
                <button
                  type="button"
                  className="text-sm sm:text-base text-blue-600 dark:text-blue-400 hover:underline p-2 min-h-touch tap-highlight-transparent"
                  onClick={() => setIsLogin(!isLogin)}
                >
                  {isLogin
                    ? "Don't have an account? Sign up"
                    : "Already have an account? Log in"}
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Features section - hidden on very small screens */}
      <div className="hidden sm:block bg-gray-50 dark:bg-gray-900/50 border-t dark:border-gray-800">
        <div className="max-w-6xl mx-auto px-4 py-8 sm:py-12">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={index} className="text-center">
                  <div className="mx-auto w-12 h-12 mb-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                    <Icon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                    {feature.title}
                  </h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Mobile features - shown only on small screens */}
      <div className="sm:hidden bg-gray-50 dark:bg-gray-900/50 border-t dark:border-gray-800 p-4">
        <div className="flex justify-around">
          {features.slice(0, 3).map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div key={index} className="text-center flex-1">
                <Icon className="h-5 w-5 text-blue-600 dark:text-blue-400 mx-auto mb-1" />
                <p className="text-xs text-gray-700 dark:text-gray-300">
                  {feature.title.split(' ')[0]}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="text-center py-4 px-4 text-xs text-gray-500 dark:text-gray-400">
        <p>© 2025 Star Gazer Analysis. All rights reserved.</p>
      </div>
    </div>
  );
};

export default Auth;
