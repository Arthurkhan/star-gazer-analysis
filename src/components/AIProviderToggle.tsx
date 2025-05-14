import { Button } from "@/components/ui/button";
import { Brain, Cloud } from "lucide-react";
import { useState, useEffect } from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export type AIProvider = 'browser' | 'api';

interface AIProviderToggleProps {
  onProviderChange?: (provider: AIProvider) => void;
}

export const AIProviderToggle = ({ onProviderChange }: AIProviderToggleProps) => {
  const [provider, setProvider] = useState<AIProvider>(() => {
    const saved = localStorage.getItem('RECOMMENDATION_AI_PROVIDER') as AIProvider;
    return saved || 'browser';
  });

  useEffect(() => {
    localStorage.setItem('RECOMMENDATION_AI_PROVIDER', provider);
    onProviderChange?.(provider);
  }, [provider, onProviderChange]);

  return (
    <div className="flex items-center gap-1">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={provider === 'browser' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setProvider('browser')}
              className="h-8"
            >
              <Brain className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">Local AI</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Fast, privacy-focused recommendations using browser-based AI</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={provider === 'api' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setProvider('api')}
              className="h-8"
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
