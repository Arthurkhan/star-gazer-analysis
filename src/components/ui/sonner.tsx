
import { useEffect, useState } from "react";
import { Toaster as Sonner } from "sonner";

interface ToasterProps {
  className?: string;
  closeButton?: boolean;
  duration?: number;
  position?: "top-left" | "top-right" | "bottom-left" | "bottom-right" | "top-center" | "bottom-center";
  theme?: "light" | "dark" | "system";
  richColors?: boolean;
  expand?: boolean;
  visibleToasts?: number;
  [key: string]: any;
}

const Toaster = ({ 
  className = "",
  theme = "system", 
  ...props 
}: ToasterProps) => {
  const [currentTheme, setCurrentTheme] = useState<"light" | "dark">("light");
  
  useEffect(() => {
    // Check for dark mode preference in the DOM
    const isDarkMode = document.documentElement.classList.contains("dark");
    
    if (theme === "system") {
      // Check system preference
      const systemPreference = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
      setCurrentTheme(systemPreference);
      
      // Add listener for system preference changes
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const handleChange = (e: MediaQueryListEvent) => {
        setCurrentTheme(e.matches ? "dark" : "light");
      };
      
      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    } else {
      // Use the explicitly set theme
      setCurrentTheme(theme === "dark" ? "dark" : "light");
    }
  }, [theme]);
  
  return (
    <Sonner
      theme={currentTheme}
      className={className}
      toastOptions={{
        className: "group border-border font-sans",
        // Fix the error by using className instead of classNames
      }}
      {...props}
    />
  );
};

export { Toaster };
