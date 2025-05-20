import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

interface DatabaseErrorDisplayProps {
  onRefresh: () => void;
  isRefreshing: boolean;
}

export const DatabaseErrorDisplay = ({ onRefresh, isRefreshing }: DatabaseErrorDisplayProps) => {
  return (
    <Alert variant="destructive" className="mb-6">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Database Connection Error</AlertTitle>
      <AlertDescription>
        <p className="mb-4">
          Unable to load data from the database. Please check your database connection settings.
        </p>
        
        <div className="p-3 bg-destructive/10 rounded mb-4 text-destructive/90">
          <p className="font-medium">Possible Solutions:</p>
          <ul className="list-disc list-inside mt-1 ml-2 space-y-1">
            <li>Verify your Supabase URL and API key in the .env file</li>
            <li>Check that the database tables exist in your Supabase project</li>
            <li>Ensure your database permissions are configured correctly</li>
            <li>Verify network connectivity to your Supabase project</li>
          </ul>
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={onRefresh}
            disabled={isRefreshing}
          >
            {isRefreshing ? 'Checking...' : 'Retry Connection'}
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
};
