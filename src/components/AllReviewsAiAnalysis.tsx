import React, { useState, useEffect, useRef } from 'react'
import type { Review } from '@/types/reviews'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RefreshCw, FileText, ClipboardCopy } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { getAnalysis, clearCache } from '@/utils/ai/analysisService'

interface AllReviewsAiAnalysisProps {
  reviews: Review[];
}

const AllReviewsAiAnalysis: React.FC<AllReviewsAiAnalysisProps> = ({ reviews }) => {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [analysis, setAnalysis] = useState<any>(null)
  const prevReviewsRef = useRef<Review[]>([])

  const fetchAnalysis = async (forceRefresh = false) => {
    if (reviews.length === 0) {
      toast({
        title: 'No reviews',
        description: 'No reviews available to analyze',
        variant: 'default',
      })
      return
    }

    setLoading(true)

    try {
      if (forceRefresh) {
        clearCache()
      }

      const result = await getAnalysis(reviews)
      setAnalysis(result)

      toast({
        title: 'Analysis complete',
        description: 'Review analysis has been generated',
      })
    } catch (err) {
      console.error('Analysis error:', err)
      toast({
        title: 'Analysis failed',
        description: 'Could not generate analysis',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Check if reviews have changed
    const reviewsChanged = reviews !== prevReviewsRef.current &&
                          (reviews.length !== prevReviewsRef.current.length ||
                           JSON.stringify(reviews[0]) !== JSON.stringify(prevReviewsRef.current[0]))

    if (reviewsChanged) {
      prevReviewsRef.current = reviews

      // Clear existing analysis when reviews change
      if (analysis) {
        console.log('Reviews changed, clearing analysis and re-fetching')
        setAnalysis(null)
        clearCache() // Clear the cache to ensure fresh analysis
      }

      // Fetch new analysis if we have reviews
      if (reviews.length > 0) {
        fetchAnalysis()
      }
    }
  }, [reviews])

  const copyToClipboard = () => {
    if (analysis?.overallAnalysis) {
      navigator.clipboard.writeText(analysis.overallAnalysis)
      toast({
        title: 'Copied to clipboard',
        description: 'Analysis copied to clipboard',
      })
    }
  }

  const renderFormattedAnalysis = () => {
    if (!analysis?.overallAnalysis) return null

    // Split by sections (each section starts with an emoji)
    const sections = analysis.overallAnalysis.split(/(?=📊|📈|🗣️|💬|🌍|🎯)/g)

    return (
      <div className="space-y-4">
        {sections.map((section: string, index: number) => (
          <div key={index} className="space-y-2">
            <div
              className="whitespace-pre-line"
              dangerouslySetInnerHTML={{
                __html: section
                  .replace(/\n/g, '<br />')
                  .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>'),
              }}
            />
          </div>
        ))}
      </div>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xl font-bold">Review Summary</CardTitle>
        <div className="flex space-x-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => copyToClipboard()}
                  disabled={!analysis?.overallAnalysis || loading}
                >
                  <ClipboardCopy className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Copy analysis to clipboard</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => fetchAnalysis(true)}
                  disabled={loading}
                >
                  <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Refresh analysis</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        {loading ? (
          <div className="text-center py-6">
            <div className="inline-block w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-2 text-sm text-muted-foreground">Analyzing reviews...</p>
          </div>
        ) : !analysis ? (
          <div className="text-center text-muted-foreground py-4">
            <Button variant="outline" onClick={() => fetchAnalysis()}>
              <FileText className="mr-2 h-4 w-4" />
              Generate Analysis
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {renderFormattedAnalysis()}

            {/* Additional visualizations */}
            {analysis.mainThemes && analysis.mainThemes.length > 0 && (
              <div className="mt-6">
                <h3 className="font-semibold mb-2">Main Themes</h3>
                <div className="flex flex-wrap gap-2">
                  {analysis.mainThemes.slice(0, 10).map((theme: any, idx: number) => (
                    <span key={idx} className="px-3 py-1 bg-primary/10 rounded-full text-sm">
                      {theme.theme} ({theme.count})
                    </span>
                  ))}
                </div>
              </div>
            )}

            {analysis.staffMentions && analysis.staffMentions.length > 0 && (
              <div className="mt-6">
                <h3 className="font-semibold mb-2">Staff Performance</h3>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {analysis.staffMentions.slice(0, 6).map((staff: any, idx: number) => (
                    <Card key={idx} className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{staff.name}</span>
                        <span className="text-sm text-muted-foreground">{staff.count} mentions</span>
                      </div>
                      <div className="flex items-center">
                        <span className={`text-sm font-medium ${
                          staff.sentiment === 'positive' ? 'text-green-600' :
                          staff.sentiment === 'negative' ? 'text-red-600' :
                          'text-yellow-600'
                        }`}>
                          {staff.sentiment.charAt(0).toUpperCase() + staff.sentiment.slice(1)}
                        </span>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default AllReviewsAiAnalysis
