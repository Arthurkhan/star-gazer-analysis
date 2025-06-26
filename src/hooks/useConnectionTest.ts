import { useEffect, useState } from 'react'
import { supabase } from '@/integrations/supabase/client'

export function useConnectionTest() {
  const [isChecking, setIsChecking] = useState(true)
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [details, setDetails] = useState<any>(null)

  useEffect(() => {
    async function checkConnection() {
      setIsChecking(true)
      try {
        // First check if we can connect at all
        console.log('Testing database connection...')

        // Get database version - this is a simple query that should work
        // even with minimal permissions
        const { data: versionData, error: versionError } = await supabase.rpc('version')

        if (versionError) {
          console.error('Error checking database version:', versionError)

          // Try a simpler approach
          const { data: simpleData, error: simpleError } = await supabase
            .from('businesses')
            .select('count(*)', { count: 'exact', head: true })

          if (simpleError) {
            console.error('Error with simple query:', simpleError)

            // One more try with public tables
            const { data: tableData, error: tableError } = await supabase
              .from('tables')
              .select('count(*)', { count: 'exact', head: true })

            if (tableError) {
              setIsConnected(false)
              setError(`Connection failed: ${simpleError.message}`)
              return
            }
          }
        }

        // Connection successful
        setIsConnected(true)
        setError(null)

        // Get more details about database
        const details: any = { tables: {} }

        // Test each table
        const tables = ['businesses', 'reviews', 'recommendations']
        for (const table of tables) {
          const { count, error } = await supabase
            .from(table)
            .select('*', { count: 'exact', head: true })

          details.tables[table] = {
            exists: !error || error.code !== 'PGRST116',
            count: count || 0,
            error: error?.message,
          }
        }

        // Check legacy tables too
        const legacyTables = ["L'Envol Art Space", 'The Little Prince Cafe', 'Vol de Nuit, The Hidden Bar']
        for (const table of legacyTables) {
          const { count, error } = await supabase
            .from(table)
            .select('*', { count: 'exact', head: true })

          details.tables[table] = {
            exists: !error || error.code !== 'PGRST116',
            count: count || 0,
            error: error?.message,
          }
        }

        setDetails(details)

      } catch (err: any) {
        console.error('Connection test failed:', err)
        setIsConnected(false)
        setError(err.message)
      } finally {
        setIsChecking(false)
      }
    }

    checkConnection()
  }, [])

  return { isChecking, isConnected, error, details }
}
