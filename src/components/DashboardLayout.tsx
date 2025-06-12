import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { AIProviderToggle } from "@/components/AIProviderToggle";
import MobileNavigation from "@/components/MobileNavigation";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Sun, Moon, LogOut, Settings } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface DashboardLayoutProps {
  children: React.ReactNode;
  onProviderChange?: (provider: any) => void;
}

const DashboardLayout = ({ children, onProviderChange }: DashboardLayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [theme, setTheme] = useState<"light" | "dark">(
    localStorage.getItem("theme") as "light" | "dark" || "light"
  );
  const [currentProvider, setCurrentProvider] = useState<string>("browser");

  useEffect(() => {
    // Apply theme to document
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    // Check which AI provider is configured
    const savedProvider = localStorage.getItem('AI_PROVIDER');
    const apiKey = savedProvider ? localStorage.getItem(`${savedProvider.toUpperCase()}_API_KEY`) : null;
    
    if (savedProvider && apiKey) {
      setCurrentProvider(savedProvider);
    } else {
      setCurrentProvider("browser");
    }
  }, [location]);

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast({
        title: "Logged out",
        description: "You've been logged out successfully",
      });
      navigate("/auth");
    } catch (error) {
      console.error("Logout error:", error);
      toast({
        title: "Error",
        description: "There was a problem logging out",
        variant: "destructive",
      });
    }
  };

  const navigateToSettings = () => {
    navigate("/ai-settings");
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <header className="bg-white dark:bg-gray-800 shadow sticky top-0 z-40">
        <div className="mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Mobile Navigation */}
            <div className="flex items-center gap-3 md:hidden">
              <MobileNavigation 
                theme={theme}
                onThemeToggle={toggleTheme}
                onLogout={handleLogout}
                currentProvider={currentProvider}
              />
              <h1 className="text-lg font-bold text-gray-900 dark:text-white truncate">
                Review Analyzer
              </h1>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-4">
              <h1 className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-white">
                Google Maps Review Analyzer
              </h1>
              {currentProvider !== "browser" && (
                <Badge variant="secondary" className="text-xs">
                  AI: {currentProvider.toUpperCase()}
                </Badge>
              )}
            </div>

            {/* Desktop Actions */}
            <div className="hidden md:flex items-center space-x-2 lg:space-x-4">
              <AIProviderToggle onProviderChange={onProviderChange} />
              <Button
                variant="ghost"
                size="icon"
                onClick={navigateToSettings}
                aria-label="AI Settings"
                title="AI Settings"
              >
                <Settings size={20} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                aria-label="Toggle theme"
              >
                {theme === "light" ? <Moon size={20} /> : <Sun size={20} />}
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleLogout}
                className="flex items-center gap-2"
              >
                <LogOut size={16} />
                <span className="hidden lg:inline">Logout</span>
              </Button>
            </div>

            {/* Mobile Actions */}
            <div className="flex md:hidden items-center gap-2">
              <AIProviderToggle onProviderChange={onProviderChange} />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <p className="text-center text-xs sm:text-sm text-gray-500 dark:text-gray-400">
            © 2025 Google Maps Review Analyzer. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default DashboardLayout;
