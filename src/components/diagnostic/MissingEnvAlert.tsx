import { useEffect, useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const MissingEnvAlert = () => {
  const [missingVars, setMissingVars] = useState<string[]>([]);
  
  useEffect(() => {
    const checkEnvVars = () => {
      const missing: string[] = [];
      
      // Check for Supabase URL and key
      const supabaseUrl = supabase.supabaseUrl;
      const supabaseKey = supabase.supabaseKey;
      
      if (!supabaseUrl || supabaseUrl === 'undefined' || supabaseUrl === '') {
        missing.push('VITE_SUPABASE_URL');
      }
      
      if (!supabaseKey || supabaseKey === 'undefined' || supabaseKey === '') {
        missing.push('VITE_SUPABASE_ANON_KEY');
      }
      
      setMissingVars(missing);
    };
    
    checkEnvVars();
  }, []);
  
  if (missingVars.length === 0) {
    return null;
  }
  
  return (
    <Alert variant="destructive" className="mb-4">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Missing Environment Variables</AlertTitle>
      <AlertDescription>
        <p className="mb-2">
          The following environment variables are missing or empty:
        </p>
        <ul className="list-disc list-inside mb-4">
          {missingVars.map(variable => (
            <li key={variable}>{variable}</li>
          ))}
        </ul>
        <p className="text-sm bg-yellow-900/20 p-2 rounded">
          These variables should be defined in your <code>.env.local</code> file:
          <pre className="mt-1 p-2 bg-black/20 rounded overflow-auto">
            {missingVars.map(v => `${v}=your_${v.toLowerCase()}_here`).join('\n')}
          </pre>
        </p>
      </AlertDescription>
    </Alert>
  );
};
