import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, CheckCircle2, Info } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
import { checkIfMigrationNeeded, migrateDataToNewSchema } from '@/utils/dataMigration';
import { useToast } from '@/hooks/use-toast';

export function DatabaseMigrationCard() {
  const [isMigrationNeeded, setIsMigrationNeeded] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationResult, setMigrationResult] = useState<{
    success?: boolean;
    businesses?: any[];
    error?: any;
  } | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    async function checkMigration() {
      try {
        const needed = await checkIfMigrationNeeded();
        setIsMigrationNeeded(needed);
      } catch (error) {
        console.error('Error checking migration status:', error);
        toast({
          title: 'Error checking migration status',
          description: 'Could not determine if migration is needed',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    }

    checkMigration();
  }, [toast]);

  const handleMigration = async () => {
    setIsMigrating(true);
    try {
      const result = await migrateDataToNewSchema();
      setMigrationResult(result);
      
      if (result.success) {
        toast({
          title: 'Migration Successful',
          description: `Migrated data for ${result.businesses?.length || 0} businesses`,
          variant: 'default',
        });
        setIsMigrationNeeded(false);
      } else {
        toast({
          title: 'Migration Failed',
          description: 'See console for details',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Migration error:', error);
      setMigrationResult({ success: false, error });
      toast({
        title: 'Migration Failed',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsMigrating(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Database Migration</CardTitle>
          <CardDescription>Checking database status...</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-6">
          <Spinner />
        </CardContent>
      </Card>
    );
  }

  if (isMigrationNeeded === false) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Database Status</CardTitle>
          <CardDescription>Using optimized schema</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="default" className="bg-green-50 border-green-200">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertTitle>Database is up to date</AlertTitle>
            <AlertDescription>
              Your database is using the optimized schema. No migration needed.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Database Migration Required</CardTitle>
        <CardDescription>
          Your database needs to be migrated to the new optimized schema
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Alert variant="default" className="bg-amber-50 border-amber-200 mb-4">
          <Info className="h-4 w-4 text-amber-600" />
          <AlertTitle>Migration Information</AlertTitle>
          <AlertDescription>
            This migration will move your data to a new normalized database structure for better performance.
            This process should take less than a minute and will not delete any data from the original tables.
          </AlertDescription>
        </Alert>

        {migrationResult?.success === false && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Migration Failed</AlertTitle>
            <AlertDescription>
              There was an error during migration. Please check the console for details.
            </AlertDescription>
          </Alert>
        )}

        {migrationResult?.success === true && (
          <Alert variant="default" className="bg-green-50 border-green-200 mb-4">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertTitle>Migration Successful</AlertTitle>
            <AlertDescription>
              Successfully migrated data for {migrationResult.businesses?.length || 0} businesses.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
      <CardFooter>
        <Button 
          onClick={handleMigration} 
          disabled={isMigrating || migrationResult?.success === true}
          className="w-full"
        >
          {isMigrating ? (
            <>
              <Spinner className="mr-2 h-4 w-4" />
              Migrating...
            </>
          ) : (
            'Migrate Database'
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
