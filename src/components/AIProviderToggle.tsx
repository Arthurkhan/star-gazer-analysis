import { Button } from "@/components/ui/button";
import { Cloud } from "lucide-react";
import { useState, useEffect } from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export type AIProvider = 'browser' | 'api';

interface AIProviderToggleProps {
  onProviderChange?: (provider: AIProvider) => void;
}

export const AIProviderToggle = ({ onProviderChange }: AIProviderToggleProps) => {
  const [provider, setProvider] = useState<AIProvider>(() => {
    // Always default to 'api' since we're removing browser option
    return 'api';
  });

  useEffect(() => {
    localStorage.setItem('RECOMMENDATION_AI_PROVIDER', provider);
    onProviderChange?.(provider);
  }, [provider, onProviderChange]);

  return (
    <div className="flex items-center">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="default"
              size="sm"
              className="h-8"
              disabled
            >
              <Cloud className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">Advanced AI</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Powerful recommendations using cloud-based AI (requires API key)</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};
