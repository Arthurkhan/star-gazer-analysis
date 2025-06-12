
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Eye, EyeOff, Star } from "lucide-react";

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

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800 flex flex-col items-center justify-center p-4 sm:p-6 animate-fade-in">
      <div className="max-w-md w-full">
        {/* Logo/Header */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-blue-100 dark:bg-blue-900/30 p-3 sm:p-4 rounded-full">
              <Star className="h-8 w-8 sm:h-10 sm:w-10 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Review Analyzer
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
            {isLogin ? "Log in to your account" : "Create a new account"}
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
                  className="dark:bg-gray-700 h-11 sm:h-10 text-base"
                  required
                  autoComplete="email"
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
                    className="dark:bg-gray-700 pr-12 h-11 sm:h-10 text-base"
                    required
                    minLength={6}
                    autoComplete={isLogin ? "current-password" : "new-password"}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center touch-target"
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
                className="w-full bg-blue-600 hover:bg-blue-700 h-11 sm:h-10 text-base sm:text-sm font-medium"
                disabled={loading || !email || !password}
              >
                {loading ? "Processing..." : isLogin ? "Log in" : "Sign up"}
              </Button>
              
              <div className="text-center pt-2">
                <button
                  type="button"
                  className="text-sm sm:text-base text-blue-600 dark:text-blue-400 hover:underline p-2 touch-target"
                  onClick={() => setIsLogin(!isLogin)}
                >
                  {isLogin
                    ? "Don't have an account? Sign up"
                    : "Already have an account? Log in"}
                </button>
              </div>
            </form>
          </CardContent>
        </Card>
        
        {/* Features list for mobile */}
        <div className="mt-8 sm:mt-10 space-y-3 px-4">
          <h2 className="text-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
            What you can do:
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-start gap-2">
              <span className="text-green-500 mt-0.5">✓</span>
              <span>Analyze Google Maps reviews</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-green-500 mt-0.5">✓</span>
              <span>Track sentiment trends</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-green-500 mt-0.5">✓</span>
              <span>AI-powered insights</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-green-500 mt-0.5">✓</span>
              <span>Export detailed reports</span>
            </div>
          </div>
        </div>
        
        <p className="text-center text-xs text-gray-500 dark:text-gray-400 mt-8 sm:mt-10">
          Google Maps Review Analyzer © 2025
        </p>
      </div>
    </div>
  );
};

export default Auth;
