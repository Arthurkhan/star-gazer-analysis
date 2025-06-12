
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Menu, X, LogOut, Settings, Sun, Moon, Home, BarChart3, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface MobileNavigationProps {
  theme: "light" | "dark";
  onThemeToggle: () => void;
  onLogout: () => void;
  currentProvider?: string;
}

const MobileNavigation = ({ theme, onThemeToggle, onLogout, currentProvider }: MobileNavigationProps) => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const navItems = [
    {
      title: "Dashboard",
      icon: Home,
      onClick: () => {
        navigate("/dashboard");
        setIsOpen(false);
      }
    },
    {
      title: "AI Settings",
      icon: Settings,
      onClick: () => {
        navigate("/ai-settings");
        setIsOpen(false);
      }
    }
  ];

  if (!isMounted) {
    return null;
  }

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon"
          className="md:hidden"
          aria-label="Open menu"
        >
          <Menu className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[300px] sm:w-[350px] p-0">
        <SheetHeader className="p-6 pb-4 border-b">
          <SheetTitle className="text-left flex items-center justify-between">
            <span>Menu</span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </SheetTitle>
        </SheetHeader>
        
        <div className="flex flex-col h-full">
          <nav className="flex-1 p-4">
            <ul className="space-y-2">
              {navItems.map((item, index) => (
                <li key={index}>
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-3 h-12"
                    onClick={item.onClick}
                  >
                    <item.icon className="h-5 w-5" />
                    <span className="text-base">{item.title}</span>
                  </Button>
                </li>
              ))}
            </ul>
            
            {currentProvider && currentProvider !== "browser" && (
              <div className="mt-4 px-3">
                <Badge variant="secondary" className="w-full justify-center py-2">
                  AI: {currentProvider.toUpperCase()}
                </Badge>
              </div>
            )}
          </nav>
          
          <div className="p-4 border-t space-y-2">
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 h-12"
              onClick={onThemeToggle}
            >
              {theme === "light" ? (
                <>
                  <Moon className="h-5 w-5" />
                  <span className="text-base">Dark Mode</span>
                </>
              ) : (
                <>
                  <Sun className="h-5 w-5" />
                  <span className="text-base">Light Mode</span>
                </>
              )}
            </Button>
            
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 h-12 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
              onClick={onLogout}
            >
              <LogOut className="h-5 w-5" />
              <span className="text-base">Logout</span>
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default MobileNavigation;
