import { useEffect, useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Database, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface DatabaseStatusProps {
  onRefresh: () => void;
  isRefreshing: boolean;
}

export const DatabaseStatus = ({ onRefresh, isRefreshing }: DatabaseStatusProps) => {
  const [isChecking, setIsChecking] = useState(true);
  const [hasIssues, setHasIssues] = useState(false);
  const [tables, setTables] = useState<string[]>([]);
  const [diagnosticInfo, setDiagnosticInfo] = useState<Record<string, any>>({});
  
  useEffect(() => {
    checkDatabaseStatus();
  }, []);
  
  const checkDatabaseStatus = async () => {
    setIsChecking(true);
    try {
      // Store diagnostic information
      const diagnostics: Record<string, any> = {
        timestamp: new Date().toISOString(),
        schema: {},
        tables: {}
      };
      
      // Basic connection check - try to get database version using a different approach
      try {
        const { data: versionData, error: versionError } = await supabase.rpc('version');
        
        if (versionError) {
          // Even if this fails, try another simple query before reporting a connection error
          const { data: systemData, error: systemError } = await supabase
            .from('pg_stat_database')
            .select('*')
            .limit(1);
          
          if (systemError) {
            // Try a basic setting query
            const { data: settingData, error: settingError } = await supabase
              .from('pg_settings')
              .select('name')
              .limit(1);
              
            if (settingError) {
              diagnostics.connection = { 
                status: 'error', 
                message: settingError.message || versionError.message
              };
              setHasIssues(true);
            } else {
              diagnostics.connection = { status: 'ok' };
            }
          } else {
            diagnostics.connection = { status: 'ok' };
          }
        } else {
          diagnostics.connection = { status: 'ok' };
        }
      } catch (error: any) {
        // Last resort - try directly checking the tables
        try {
          // If we can at least check the businesses table, connection is probably fine
          const { count, error } = await supabase
            .from('businesses')
            .select('*', { count: 'exact', head: true });
            
          if (!error) {
            // If we can query businesses, connection is ok
            diagnostics.connection = { status: 'ok', businesses_count: count };
          } else {
            // Check one of the legacy tables
            const { count: legacyCount, error: legacyError } = await supabase
              .from("The Little Prince Cafe")
              .select('*', { count: 'exact', head: true });
              
            if (!legacyError) {
              // If legacy query works, connection is ok
              diagnostics.connection = { status: 'ok', legacy_count: legacyCount };
            } else {
              diagnostics.connection = {
                status: 'error',
                message: error?.message || 'Unknown connection error'
              };
              setHasIssues(true);
            }
          }
        } catch (nestedError: any) {
          console.error("Database connection check failed:", error, nestedError);
          diagnostics.connection = {
            status: 'error',
            message: error?.message || nestedError?.message || 'Unknown connection error'
          };
          setHasIssues(true);
        }
      }
      
      // Try to detect which tables exist by directly querying them
      const expectedTables = [
        'businesses',
        'reviews',
        'recommendations',
        "L'Envol Art Space",
        "The Little Prince Cafe", 
        "Vol de Nuit, The Hidden Bar"
      ];
      
      const existingTables: string[] = [];
      
      for (const table of expectedTables) {
        try {
          const { count, error } = await supabase
            .from(table)
            .select('*', { count: 'exact', head: true });
          
          if (!error) {
            existingTables.push(table);
            diagnostics.tables[table] = { exists: true, count };
          } else {
            diagnostics.tables[table] = { 
              exists: false, 
              error: error.message 
            };
          }
        } catch (err) {
          console.error(`Error checking table ${table}:`, err);
          diagnostics.tables[table] = { 
            exists: false, 
            error: 'Query error' 
          };
        }
      }
      
      setTables(existingTables);
      
      // Check for both new schema and old schema
      const newSchemaPresent = existingTables.includes('businesses') && existingTables.includes('reviews');
      const oldSchemaPresent = existingTables.some(t => 
        t === "L'Envol Art Space" || 
        t === "The Little Prince Cafe" || 
        t === "Vol de Nuit, The Hidden Bar"
      );
      
      diagnostics.schema = {
        newSchemaPresent,
        oldSchemaPresent
      };
      
      if (!newSchemaPresent && !oldSchemaPresent) {
        setHasIssues(true);
        diagnostics.noSchemaFound = true;
      }
      
      // Check supabase URL and key (redacted for security)
      const supabaseUrl = supabase.supabaseUrl;
      const supabaseKey = supabase.supabaseKey;
      
      diagnostics.config = {
        url: supabaseUrl ? `${supabaseUrl.substring(0, 10)}...` : 'Not set',
        key: supabaseKey ? `${supabaseKey.substring(0, 5)}...` : 'Not set'
      };
      
      setDiagnosticInfo(diagnostics);
    } catch (error) {
      console.error("Error checking database status:", error);
      setHasIssues(true);
      setDiagnosticInfo({
        timestamp: new Date().toISOString(),
        error: 'Fatal error checking database status'
      });
    } finally {
      setIsChecking(false);
    }
  };
  
  const handleRetry = async () => {
    await checkDatabaseStatus();
    if (!hasIssues) {
      onRefresh();
    }
  };
  
  if (isChecking) {
    return (
      <Card className="w-full mb-4">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Database className="w-5 h-5 mr-2" />
            Checking Database Status...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center p-4">
            <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (hasIssues) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Database Connection Issues</AlertTitle>
        <AlertDescription>
          <p className="mb-4">
            Unable to connect to the database properly or schema issues detected. This is why no data is loading.
          </p>
          <div className="text-xs p-2 bg-destructive/20 rounded mb-4 max-h-32 overflow-auto">
            <pre>{JSON.stringify(diagnosticInfo, null, 2)}</pre>
          </div>
          
          <div className="p-2 bg-yellow-900/20 rounded mb-4 text-yellow-600 dark:text-yellow-400">
            <p className="font-medium">Possible Solutions:</p>
            <ul className="list-disc list-inside mt-1 ml-2 space-y-1">
              <li>Check your Supabase URL and API key in the .env file</li>
              <li>Verify the database tables exist in your Supabase project</li>
              <li>Check database network connectivity</li>
              <li>Verify you're using the correct Supabase project</li>
            </ul>
          </div>
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={handleRetry}
              disabled={isRefreshing}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Checking...' : 'Retry Connection'}
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    );
  }
  
  return null;
};