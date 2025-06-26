import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { migrateDataToNewSchema, checkIfMigrationNeeded } from '@/utils/dataMigration'

/**
 * Database Migration component for the settings page
 * Handles migrating from the old schema to the new schema
 */
const DatabaseMigration: React.FC = () => {
  const [migrationNeeded, setMigrationNeeded] = useState<boolean | null>(null)
  const [migrationStatus, setMigrationStatus] = useState<'idle' | 'running' | 'success' | 'error'>('idle')
  const [statusMessage, setStatusMessage] = useState<string>('')
  const [checking, setChecking] = useState(true)

  // Check if migration is needed when the component mounts
  useEffect(() => {
    const checkMigration = async () => {
      try {
        setChecking(true)
        const needed = await checkIfMigrationNeeded()
        setMigrationNeeded(needed)
        setStatusMessage(needed
          ? 'Your database needs to be migrated to the new schema for better performance'
          : 'Your database is already using the new schema')
      } catch (error) {
        console.error('Error checking migration status:', error)
        setStatusMessage('Error checking migration status')
        setMigrationNeeded(null)
      } finally {
        setChecking(false)
      }
    }

    checkMigration()
  }, [])

  // Handle migration
  const handleMigration = async () => {
    try {
      setMigrationStatus('running')
      setStatusMessage('Migrating database schema. This may take a few minutes...')

      const result = await migrateDataToNewSchema()

      if (result.success) {
        setMigrationStatus('success')
        setStatusMessage(`Migration completed successfully! Created ${result.businesses?.length || 0} businesses.`)
        setMigrationNeeded(false)
      } else {
        setMigrationStatus('error')
        setStatusMessage(`Migration failed: ${result.error}`)
      }
    } catch (error) {
      setMigrationStatus('error')
      setStatusMessage(`Migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
      console.error('Migration error:', error)
    }
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Database Schema Migration</CardTitle>
        <CardDescription>
          Migrate from the legacy "one table per business" model to the new normalized schema
        </CardDescription>
      </CardHeader>
      <CardContent>
        {checking ? (
          <div className="flex items-center space-x-2 text-sm">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Checking database schema...</span>
          </div>
        ) : migrationNeeded === null ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              {statusMessage || 'Could not check if migration is needed. Please try again later.'}
            </AlertDescription>
          </Alert>
        ) : migrationNeeded ? (
          <div className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4 text-amber-500" />
              <AlertTitle>Migration Required</AlertTitle>
              <AlertDescription>
                {statusMessage}
              </AlertDescription>
            </Alert>

            <div className="text-sm">
              <p className="font-medium mb-2">Benefits of the new schema:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Better performance with large datasets</li>
                <li>Simpler querying across businesses</li>
                <li>Easier to add new businesses</li>
                <li>Improved caching and pagination</li>
                <li>Support for advanced analytics</li>
              </ul>
            </div>

            {migrationStatus === 'running' && (
              <div className="flex items-center space-x-2 text-sm">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>{statusMessage}</span>
              </div>
            )}

            {migrationStatus === 'error' && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Migration Failed</AlertTitle>
                <AlertDescription>
                  {statusMessage}
                </AlertDescription>
              </Alert>
            )}
          </div>
        ) : (
          <Alert variant="default">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <AlertTitle>No Migration Needed</AlertTitle>
            <AlertDescription>
              {statusMessage}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>

      {migrationNeeded && migrationStatus !== 'success' && (
        <CardFooter className="justify-between">
          <p className="text-sm text-gray-500">
            Migration will not delete any data
          </p>
          <Button
            onClick={handleMigration}
            disabled={migrationStatus === 'running'}
          >
            {migrationStatus === 'running' && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Migrate Database
          </Button>
        </CardFooter>
      )}

      {migrationStatus === 'success' && (
        <CardFooter>
          <Alert variant="default" className="w-full">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <AlertTitle>Migration Complete</AlertTitle>
            <AlertDescription>
              {statusMessage}
            </AlertDescription>
          </Alert>
        </CardFooter>
      )}
    </Card>
  )
}

export default DatabaseMigration
