
// This file handles provider-specific configurations and utilities
import { supabase } from "@/integrations/supabase/client";

// Get the selected AI model based on provider
export function getSelectedModel(provider: string): string {
  switch (provider) {
    case "openai":
      return localStorage.getItem("OPENAI_MODEL") || "gpt-4o-mini";
    case "anthropic":
      return localStorage.getItem("ANTHROPIC_MODEL") || "claude-3-haiku-20240307";
    case "gemini":
      return localStorage.getItem("GEMINI_MODEL") || "gemini-1.5-flash";
    default:
      return "";
  }
}

// Verify if the API key is set
export async function testApiKey(provider: string): Promise<boolean> {
  try {
    const { data, error } = await supabase.functions.invoke("analyze-reviews", {
      body: { 
        action: "test",
        provider: provider
      }
    });
    
    if (error) {
      console.error("Error checking API key:", error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Error checking API key:", error);
    return false;
  }
}
