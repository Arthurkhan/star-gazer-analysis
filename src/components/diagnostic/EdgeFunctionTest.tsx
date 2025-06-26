import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FlaskConical, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { recommendationService } from '@/services/recommendationService'

export const EdgeFunctionTest: React.FC = () => {
  const [testing, setTesting] = useState(false)
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    data?: any;
  } | null>(null)

  const handleTest = async () => {
    setTesting(true)
    setResult(null)

    try {
      const testResult = await recommendationService.testEdgeFunction()
      setResult(testResult)

      // Log to console for debugging
      console.log('Edge Function Test Result:', testResult)
      if (testResult.data) {
        console.log('Test Data:', JSON.stringify(testResult.data, null, 2))
      }
    } catch (error) {
      setResult({
        success: false,
        message: error instanceof Error ? error.message : 'Test failed',
      })
    } finally {
      setTesting(false)
    }
  }

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FlaskConical className="h-5 w-5" />
          Edge Function Test
        </CardTitle>
        <CardDescription>
          Test if the edge function is deployed and working correctly
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          onClick={handleTest}
          disabled={testing}
          variant="outline"
          className="w-full"
        >
          {testing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Testing Edge Function...
            </>
          ) : (
            <>
              <FlaskConical className="mr-2 h-4 w-4" />
              Test Edge Function
            </>
          )}
        </Button>

        {result && (
          <Alert variant={result.success ? 'default' : 'destructive'}>
            <div className="flex items-start gap-2">
              {result.success ? (
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
              )}
              <div className="flex-1">
                <AlertTitle>{result.success ? 'Success!' : 'Test Failed'}</AlertTitle>
                <AlertDescription className="mt-1">
                  {result.message}
                  {result.data && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-sm font-medium">
                        View Response Data
                      </summary>
                      <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-x-auto">
                        {JSON.stringify(result.data, null, 2)}
                      </pre>
                    </details>
                  )}
                </AlertDescription>
              </div>
            </div>
          </Alert>
        )}

        <Alert>
          <AlertTitle>Debug Info</AlertTitle>
          <AlertDescription className="text-xs space-y-1 mt-2">
            <div>Open Developer Tools (F12) → Console to see detailed logs</div>
            <div>This test verifies the edge function is deployed and responding</div>
            <div>It does NOT call OpenAI API</div>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  )
}
