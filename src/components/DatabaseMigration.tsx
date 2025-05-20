import { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Database, RefreshCw, CheckCircle, XCircle, ArrowRightCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { BUSINESS_TYPE_MAPPINGS } from "@/types/BusinessMappings";

export const DatabaseMigration = () => {
  const [status, setStatus] = useState<'idle' | 'checking' | 'ready' | 'migrating' | 'completed' | 'error'>('idle');
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [diagnostics, setDiagnostics] = useState<Record<string, any>>({});
  const [businessCount, setBusinessCount] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);
  
  useEffect(() => {
    checkMigrationStatus();
  }, []);
  
  const checkMigrationStatus = async () => {
    setStatus('checking');
    setStatusMessage('Checking current database status...');
    
    try {
      // Check if new tables exist
      const hasBusinesses = await tableExists('businesses');
      const hasReviews = await tableExists('reviews');
      const hasRecommendations = await tableExists('recommendations');
      
      // Check if old tables exist
      const oldTables = [
        "L'Envol Art Space",
        "The Little Prince Cafe", 
        "Vol de Nuit, The Hidden Bar"
      ];
      
      const existingOldTables = [];
      for (const table of oldTables) {
        if (await tableExists(table)) {
          existingOldTables.push(table);
        }
      }
      
      // Get counts for old tables
      let oldTableReviewCount = 0;
      for (const table of existingOldTables) {
        const { count } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });
        
        oldTableReviewCount += count || 0;
      }
      
      // Get counts for new tables
      let newBusinessCount = 0;
      let newReviewCount = 0;
      
      if (hasBusinesses) {
        const { count } = await supabase
          .from('businesses')
          .select('*', { count: 'exact', head: true });
        
        newBusinessCount = count || 0;
      }
      
      if (hasReviews) {
        const { count } = await supabase
          .from('reviews')
          .select('*', { count: 'exact', head: true });
        
        newReviewCount = count || 0;
      }
      
      // Determine migration status
      const needsMigration = existingOldTables.length > 0 && oldTableReviewCount > 0;
      const alreadyMigrated = hasBusinesses && hasReviews && newBusinessCount > 0 && newReviewCount > 0;
      
      setDiagnostics({
        oldTables: {
          exist: existingOldTables.length > 0,
          tables: existingOldTables,
          reviewCount: oldTableReviewCount
        },
        newTables: {
          businessesExists: hasBusinesses,
          reviewsExists: hasReviews,
          recommendationsExists: hasRecommendations,
          businessCount: newBusinessCount,
          reviewCount: newReviewCount
        },
        needsMigration,
        alreadyMigrated
      });
      
      if (alreadyMigrated && !needsMigration) {
        setStatus('completed');
        setStatusMessage('Database is already using the new schema.');
      } else if (needsMigration) {
        setStatus('ready');
        setStatusMessage('Database has data in the old schema that needs to be migrated.');
      } else {
        setStatus('error');
        setStatusMessage('Could not determine database migration status.');
      }
    } catch (error) {
      console.error('Error checking migration status:', error);
      setStatus('error');
      setStatusMessage('Error checking database migration status.');
    }
  };
  
  const tableExists = async (tableName: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from(tableName)
        .select('*', { head: true })
        .limit(1);
      
      if (error && error.code === '42P01') {
        return false;
      }
      
      return true;
    } catch (error) {
      console.error(`Error checking if table ${tableName} exists:`, error);
      return false;
    }
  };
  
  const createNewTables = async () => {
    try {
      // Create businesses table
      if (!await tableExists('businesses')) {
        await supabase.rpc('create_businesses_table');
      }
      
      // Create reviews table
      if (!await tableExists('reviews')) {
        await supabase.rpc('create_reviews_table');
      }
      
      // Create recommendations table
      if (!await tableExists('recommendations')) {
        await supabase.rpc('create_recommendations_table');
      }
      
      return true;
    } catch (error) {
      console.error('Error creating tables:', error);
      throw error;
    }
  };
  
  const migrateData = async () => {
    setStatus('migrating');
    setProgress(0);
    setStatusMessage('Starting migration...');
    
    try {
      // Create new tables if they don't exist
      setStatusMessage('Creating new tables if needed...');
      await createNewTables();
      setProgress(10);
      
      // Check which old tables exist
      const oldTables = [
        "L'Envol Art Space",
        "The Little Prince Cafe", 
        "Vol de Nuit, The Hidden Bar"
      ];
      
      const existingOldTables = [];
      for (const table of oldTables) {
        if (await tableExists(table)) {
          existingOldTables.push(table);
        }
      }
      
      setStatusMessage(`Found ${existingOldTables.length} old tables to migrate.`);
      setProgress(20);
      
      // Create businesses in the businesses table
      let businessInsertCount = 0;
      for (const tableName of existingOldTables) {
        const businessType = BUSINESS_TYPE_MAPPINGS[tableName] || 'OTHER';
        
        const { data, error } = await supabase
          .from('businesses')
          .insert({
            name: tableName,
            business_type: businessType
          })
          .select('id');
        
        if (error) {
          console.error(`Error inserting business ${tableName}:`, error);
          continue;
        }
        
        const businessId = data[0].id;
        
        setStatusMessage(`Migrating reviews for: ${tableName}`);
        
        // Get all reviews from the old table
        const { data: reviews, error: reviewsError } = await supabase
          .from(tableName)
          .select('*');
        
        if (reviewsError) {
          console.error(`Error fetching reviews from ${tableName}:`, reviewsError);
          continue;
        }
        
        // Insert reviews into the new reviews table
        let insertedReviews = 0;
        const totalReviews = reviews.length;
        
        // Batch reviews in groups of 100
        const batchSize = 100;
        for (let i = 0; i < reviews.length; i += batchSize) {
          const batch = reviews.slice(i, i + batchSize);
          
          // Transform reviews to match the new schema
          const transformedReviews = batch.map(review => ({
            business_id: businessId,
            stars: review.stars,
            name: review.name,
            text: review.text,
            texttranslated: review.textTranslated,
            publishedatdate: review.publishedAtDate,
            reviewurl: review.reviewUrl,
            responsefromownertext: review.responseFromOwnerText,
            sentiment: review.sentiment,
            staffmentioned: review.staffMentioned,
            mainthemes: review.mainThemes
          }));
          
          // Insert batch of reviews
          const { error: insertError } = await supabase
            .from('reviews')
            .insert(transformedReviews);
          
          if (insertError) {
            console.error(`Error inserting reviews batch for ${tableName}:`, insertError);
            continue;
          }
          
          insertedReviews += batch.length;
          setStatusMessage(`Migrated ${insertedReviews}/${totalReviews} reviews for ${tableName}`);
          
          // Update progress
          const businessProgress = (businessInsertCount / existingOldTables.length) * 70;
          const reviewProgress = (insertedReviews / totalReviews) * (70 / existingOldTables.length);
          setProgress(20 + businessProgress + reviewProgress);
        }
        
        setReviewCount(prev => prev + insertedReviews);
        businessInsertCount++;
        setBusinessCount(businessInsertCount);
      }
      
      setStatusMessage('Migration completed successfully!');
      setProgress(100);
      setStatus('completed');
    } catch (error) {
      console.error('Error during migration:', error);
      setStatusMessage(`Migration error: ${error.message}`);
      setStatus('error');
    }
  };
  
  const renderContent = () => {
    switch (status) {
      case 'checking':
        return (
          <>
            <CardContent>
              <div className="flex items-center justify-center mb-4">
                <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
              <p className="text-center">{statusMessage}</p>
            </CardContent>
          </>
        );
        
      case 'ready':
        return (
          <>
            <CardContent>
              <Alert className="mb-4">
                <ArrowRightCircle className="h-4 w-4" />
                <AlertTitle>Database Migration Required</AlertTitle>
                <AlertDescription>
                  Your database is using the old schema structure with separate tables per business. 
                  Migrating to the new schema will improve performance and enable new features.
                </AlertDescription>
              </Alert>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="p-4 border rounded-md">
                  <h3 className="text-sm font-medium mb-2">Old Schema</h3>
                  <p className="text-xs text-muted-foreground mb-1">Tables: {diagnostics.oldTables?.tables.length || 0}</p>
                  <p className="text-xs text-muted-foreground">Reviews: {diagnostics.oldTables?.reviewCount || 0}</p>
                </div>
                <div className="p-4 border rounded-md">
                  <h3 className="text-sm font-medium mb-2">New Schema</h3>
                  <p className="text-xs text-muted-foreground mb-1">Businesses: {diagnostics.newTables?.businessCount || 0}</p>
                  <p className="text-xs text-muted-foreground">Reviews: {diagnostics.newTables?.reviewCount || 0}</p>
                </div>
              </div>
              
              <div className="text-sm p-2 bg-yellow-900/20 rounded mb-4 text-yellow-600 dark:text-yellow-400">
                <p className="font-medium">Migration Notes:</p>
                <ul className="list-disc list-inside mt-1 ml-2 space-y-1">
                  <li>This process will keep your original tables intact</li>
                  <li>All reviews will be migrated to the new schema</li>
                  <li>Migration may take a few minutes for large datasets</li>
                  <li>Once complete, the app will use the new schema automatically</li>
                </ul>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
              <Button 
                onClick={checkMigrationStatus} 
                variant="outline"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh Status
              </Button>
              <Button onClick={migrateData}>Start Migration</Button>
            </CardFooter>
          </>
        );
        
      case 'migrating':
        return (
          <>
            <CardContent>
              <div className="mb-4">
                <Progress value={progress} className="w-full" />
                <p className="text-center text-sm mt-2">{progress.toFixed(0)}% complete</p>
              </div>
              <p className="text-center">{statusMessage}</p>
              
              <div className="mt-4 text-sm bg-slate-100 dark:bg-slate-900 p-3 rounded">
                <p><span className="font-medium">Businesses migrated:</span> {businessCount}</p>
                <p><span className="font-medium">Reviews migrated:</span> {reviewCount}</p>
              </div>
            </CardContent>
          </>
        );
        
      case 'completed':
        return (
          <>
            <CardContent>
              <div className="flex justify-center mb-4">
                <CheckCircle className="w-12 h-12 text-green-500" />
              </div>
              <p className="text-center mb-4">{statusMessage}</p>
              
              <div className="text-sm p-2 bg-green-900/20 rounded mb-4 text-green-600 dark:text-green-400">
                <p className="font-medium">Migration Summary:</p>
                <ul className="list-none mt-1 space-y-1">
                  <li><span className="font-medium">Businesses:</span> {businessCount || diagnostics.newTables?.businessCount || 'N/A'}</li>
                  <li><span className="font-medium">Reviews:</span> {reviewCount || diagnostics.newTables?.reviewCount || 'N/A'}</li>
                  <li><span className="font-medium">Status:</span> Using optimized database schema</li>
                </ul>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button 
                onClick={() => window.location.reload()} 
                variant="outline"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh Application
              </Button>
            </CardFooter>
          </>
        );
        
      case 'error':
        return (
          <>
            <CardContent>
              <div className="flex justify-center mb-4">
                <XCircle className="w-12 h-12 text-red-500" />
              </div>
              <p className="text-center mb-4">{statusMessage}</p>
              
              <div className="text-xs p-2 bg-red-900/20 rounded mb-4 overflow-auto max-h-32">
                <pre>{JSON.stringify(diagnostics, null, 2)}</pre>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button 
                onClick={checkMigrationStatus} 
                variant="outline"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
            </CardFooter>
          </>
        );
        
      default:
        return null;
    }
  };
  
  return (
    <Card className="w-full mb-4">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Database className="w-5 h-5 mr-2" />
          Database Migration
        </CardTitle>
        <CardDescription>
          Optimize your database structure for better performance
        </CardDescription>
      </CardHeader>
      {renderContent()}
    </Card>
  );
};