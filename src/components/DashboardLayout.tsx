
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/components/ui/use-toast";
import { Sun, Moon, LogOut, FileDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { exportToPDF } from "@/utils/pdfExport";
import { Review } from "@/types/reviews";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [theme, setTheme] = useState<"light" | "dark">(
    localStorage.getItem("theme") as "light" | "dark" || "light"
  );

  // Store global review data for export functionality
  const [exportReviews, setExportReviews] = useState<Review[]>([]);
  const [exportBusinessName, setExportBusinessName] = useState<string>("All Businesses");

  useEffect(() => {
    // Apply theme to document
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  // Setup a global event listener to capture review data for export
  useEffect(() => {
    const handleExportData = (event: CustomEvent) => {
      setExportReviews(event.detail.reviews || []);
      setExportBusinessName(event.detail.businessName || "All Businesses");
    };

    // Add event listener
    window.addEventListener('prepare-export-data', handleExportData as EventListener);

    // Clean up
    return () => {
      window.removeEventListener('prepare-export-data', handleExportData as EventListener);
    };
  }, []);

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

  const handleExportPDF = () => {
    if (exportReviews.length === 0) {
      toast({
        title: "No data to export",
        description: "Please wait for the data to load or make sure there is data available",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Export initiated",
      description: "Your PDF report is being generated...",
    });
    
    try {
      exportToPDF(exportReviews, exportBusinessName);
      
      toast({
        title: "Export complete",
        description: "Your PDF report has been downloaded",
      });
    } catch (error) {
      console.error("PDF generation error:", error);
      toast({
        title: "Export failed",
        description: "There was a problem generating your PDF",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Google Maps Review Analyzer
            </h1>
          </div>
          <div className="flex items-center space-x-4">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleExportPDF}
              className="hidden sm:flex items-center gap-2"
            >
              <FileDown size={16} />
              Export PDF
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
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <p className="text-center text-sm text-gray-500 dark:text-gray-400">
            © 2025 Google Maps Review Analyzer. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default DashboardLayout;
