import { useState } from 'react'
import { AlertCircle, RefreshCw, Database } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { useConnectionTest } from '@/hooks/useConnectionTest'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface DatabaseErrorDisplayProps {
  onRefresh: () => void;
  isRefreshing: boolean;
}

export const DatabaseErrorDisplay = ({ onRefresh, isRefreshing }: DatabaseErrorDisplayProps) => {
  const [showDetails, setShowDetails] = useState(false)
  const { isChecking, isConnected, error, details } = useConnectionTest()

  return (
    <>
      <Alert variant="destructive" className="mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Database Connection Issue</AlertTitle>
        <AlertDescription>
          <p className="mb-4">
            {isChecking ? (
              'Checking database connection...'
            ) : (
              isConnected ?
                'Connection established, but unable to load data. Database may be empty or permissions issue.' :
                'Unable to load data from the database. Please check your database connection settings.'
            )}
          </p>

          <div className="p-3 bg-destructive/10 rounded mb-4 text-destructive/90">
            <p className="font-medium">Possible Solutions:</p>
            <ul className="list-disc list-inside mt-1 ml-2 space-y-1">
              <li>Verify your Supabase URL and API key in the .env file</li>
              <li>Check that the database tables exist in your Supabase project</li>
              <li>Ensure your database permissions are configured correctly</li>
              <li>Verify network connectivity to your Supabase project</li>
              <li>Try using the service_role key for full access to tables</li>
            </ul>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={onRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Checking...' : 'Retry Connection'}
            </Button>

            <Button
              variant="secondary"
              onClick={() => setShowDetails(!showDetails)}
            >
              {showDetails ? 'Hide Details' : 'Show Diagnostics'}
            </Button>
          </div>
        </AlertDescription>
      </Alert>

      {showDetails && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Database className="w-5 h-5 mr-2" />
              Database Diagnostics Report
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs p-2 bg-muted rounded mb-4 overflow-auto max-h-64">
              <p className="text-sm font-medium mb-2">Connection Status:</p>
              <p>Checking: {isChecking ? 'Yes' : 'No'}</p>
              <p>Connected: {isConnected ? 'Yes' : 'No'}</p>
              {error && <p>Error: {error}</p>}

              {details && (
                <>
                  <p className="text-sm font-medium mt-4 mb-2">Table Status:</p>
                  <pre>{JSON.stringify(details, null, 2)}</pre>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </>
  )
}
