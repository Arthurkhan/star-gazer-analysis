import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Spinner } from '@/components/ui/spinner'
import { Info, Database, Rows } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'

const tables = ['businesses', 'reviews', 'recommendations']

export function DatabaseTableInspector() {
  const [selectedTable, setSelectedTable] = useState('businesses')
  const [tableData, setTableData] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [columnNames, setColumnNames] = useState<string[]>([])
  const [rowCount, setRowCount] = useState<number | null>(null)

  const fetchTableData = async (tableName: string) => {
    setIsLoading(true)
    setError(null)
    try {
      // First, get the row count
      const { count, error: countError } = await supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true })

      if (countError) {
        throw countError
      }

      setRowCount(count)

      // Then fetch limited data for preview
      const { data, error: dataError } = await supabase
        .from(tableName)
        .select('*')
        .limit(10)

      if (dataError) {
        throw dataError
      }

      if (data && data.length > 0) {
        // Extract column names from the first row
        setColumnNames(Object.keys(data[0]))
        setTableData(data)
      } else {
        setColumnNames([])
        setTableData([])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred')
      console.error('Error fetching table data:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchTableData(selectedTable)
  }, [selectedTable])

  return (
    <Card className="w-full overflow-hidden">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="w-5 h-5" />
          Database Tables Inspector
        </CardTitle>
        <CardDescription>
          View and inspect data in the new database schema
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2 mb-4">
          {tables.map(table => (
            <Button
              key={table}
              variant={selectedTable === table ? 'default' : 'outline'}
              onClick={() => setSelectedTable(table)}
              className="capitalize"
            >
              {table}
            </Button>
          ))}
        </div>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertTitle>Error loading table data</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {isLoading ? (
          <div className="flex justify-center p-8">
            <Spinner />
          </div>
        ) : tableData.length === 0 ? (
          <Alert className="mb-4 bg-amber-50 border-amber-200">
            <Info className="h-4 w-4 text-amber-600" />
            <AlertTitle>No data found</AlertTitle>
            <AlertDescription>
              This table appears to be empty. Make sure your data has been migrated correctly.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableCaption>
                <div className="flex items-center justify-center gap-1">
                  <Rows className="w-4 h-4" />
                  {rowCount !== null ? (
                    <span>Showing 10 of {rowCount} rows in the {selectedTable} table</span>
                  ) : (
                    <span>Showing data from the {selectedTable} table</span>
                  )}
                </div>
              </TableCaption>
              <TableHeader>
                <TableRow>
                  {columnNames.map((column) => (
                    <TableHead key={column}>{column}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {tableData.map((row, rowIndex) => (
                  <TableRow key={rowIndex}>
                    {columnNames.map((column) => (
                      <TableCell key={column}>
                        {typeof row[column] === 'object'
                          ? `${JSON.stringify(row[column]).substring(0, 50)}...`
                          : String(row[column]).substring(0, 50)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button
          onClick={() => fetchTableData(selectedTable)}
          disabled={isLoading}
          variant="outline"
          className="ml-auto"
        >
          {isLoading ? <Spinner className="mr-2 h-4 w-4" /> : null}
          Refresh Data
        </Button>
      </CardFooter>
    </Card>
  )
}
