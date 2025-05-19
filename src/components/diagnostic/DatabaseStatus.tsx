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
        schema: {}
      };
      
      // Check if we can connect to Supabase
      const { data: healthCheck, error: healthError } = await supabase.rpc('pg_stat_activity');
      
      if (healthError) {
        console.error("Database health check failed:", healthError);
        diagnostics.connection = {
          status: 'error',
          message: healthError.message
        };
        setHasIssues(true);
      } else {
        diagnostics.connection = {
          status: 'ok'
        };
      }
      
      // Try to list tables 
      try {
        const { data: tablesData } = await supabase.rpc('list_tables');
        setTables(tablesData || []);
        diagnostics.tables = tablesData;
        
        // Check for both new schema and old schema
        const newSchemaPresent = tablesData?.includes('businesses') && tablesData?.includes('reviews');
        const oldSchemaPresent = tablesData?.some(t => 
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
        }
        
        // Check row counts in each table
        for (const table of tablesData || []) {
          try {
            const { count, error } = await supabase
              .from(table)
              .select('*', { count: 'exact', head: true });
              
            if (!error) {
              diagnostics[table] = { rowCount: count };
            }
          } catch (err) {
            console.error(`Error counting rows in ${table}:`, err);
          }
        }
      } catch (error) {
        console.error("Error listing tables:", error);
        diagnostics.tablesError = error;
        setHasIssues(true);
      }
      
      setDiagnosticInfo(diagnostics);
    } catch (error) {
      console.error("Error checking database status:", error);
      setHasIssues(true);
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
