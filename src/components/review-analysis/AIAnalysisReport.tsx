import React, { useState, useEffect } from 'react'
import type { Review } from '@/types/reviews'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RefreshCw, FileText, ClipboardCopy, Download } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { getAnalysis, clearCache } from '@/utils/ai/analysisService'
import { generateAndDownloadPDF } from '@/services/exportService'

interface DateRange {
  from: Date
  to: Date | undefined
}

interface AIAnalysisReportProps {
  reviews: Review[]
  dateRange?: DateRange
  title?: string
  className?: string
}

const AIAnalysisReport: React.FC<AIAnalysisReportProps> = ({
  reviews,
  dateRange,
  title = 'Analysis Report',
  className = '',
}) => {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [analysis, setAnalysis] = useState<any>(null)

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
      // Clear cache if forcing refresh
      if (forceRefresh) {
        clearCache()
      }

      // Get analysis from the service - now using pre-computed data
      const result = await getAnalysis(
        reviews,
        dateRange
          ? {
              startDate: dateRange.from.toISOString(),
              endDate: dateRange.to
                ? dateRange.to.toISOString()
                : new Date().toISOString(),
            }
          : undefined,
      )

      setAnalysis(result)

      toast({
        title: 'Analysis complete',
        description: 'Report has been generated',
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

  // Initialize analysis on first load
  useEffect(() => {
    if (reviews.length > 0 && !analysis && !loading) {
      fetchAnalysis()
    }
  }, [reviews, dateRange])

  const copyToClipboard = () => {
    if (analysis?.overallAnalysis) {
      navigator.clipboard.writeText(analysis.overallAnalysis)
      toast({
        title: 'Copied to clipboard',
        description: 'Analysis copied to clipboard',
      })
    }
  }

  const downloadPDF = async () => {
    if (analysis?.overallAnalysis) {
      try {
        // Transform analysis for new PDF system
        const exportData = {
          historicalTrends: [],
          reviewClusters: [],
          temporalPatterns: {
            dayOfWeek: [],
            timeOfDay: [],
          },
          seasonalAnalysis: [],
          insights: [analysis.overallAnalysis],
        }

        const exportOptions = {
          businessName: title || 'Business',
          businessType: 'CAFE' as const,
          includeCharts: false,
          includeTables: false,
          includeRecommendations: false,
          customTitle: `${title} - AI Analysis Report`,
          brandingColor: '#3B82F6',
        }

        await generateAndDownloadPDF(exportData, exportOptions)

        toast({
          title: 'PDF downloaded',
          description: 'Analysis report has been downloaded',
        })
      } catch (error) {
        toast({
          title: 'Download failed',
          description: 'Failed to generate PDF report',
          variant: 'destructive',
        })
      }
    }
  }

  const renderFormattedAnalysis = () => {
    if (!analysis?.overallAnalysis) return null

    // Split by sections (each section starts with an emoji)
    const sections = analysis.overallAnalysis.split(/(?=📊|📈|🗣️|💬|🌍|🎯)/g)

    return (
      <div className='space-y-4'>
        {sections.map((section: string, index: number) => (
          <div key={index} className='space-y-2'>
            <div
              className='whitespace-pre-line'
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
    <Card className={className}>
      <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
        <CardTitle className='text-xl font-bold'>{title}</CardTitle>
        <div className='flex space-x-2'>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant='outline'
                  size='icon'
                  onClick={() => copyToClipboard()}
                  disabled={!analysis?.overallAnalysis || loading}
                >
                  <ClipboardCopy className='h-4 w-4' />
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
                  variant='outline'
                  size='icon'
                  onClick={() => downloadPDF()}
                  disabled={!analysis?.overallAnalysis || loading}
                >
                  <Download className='h-4 w-4' />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Download as PDF</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant='outline'
                  size='icon'
                  onClick={() => fetchAnalysis(true)}
                  disabled={loading}
                >
                  <RefreshCw
                    className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`}
                  />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Refresh analysis</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardHeader>
      <CardContent className='pt-6'>
        {loading ? (
          <div className='text-center py-6'>
            <div className='inline-block w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin'></div>
            <p className='mt-2 text-sm text-muted-foreground'>
              Generating report...
            </p>
          </div>
        ) : !analysis?.overallAnalysis ? (
          <div className='text-center text-muted-foreground py-4'>
            <Button variant='outline' onClick={() => fetchAnalysis()}>
              <FileText className='mr-2 h-4 w-4' />
              Generate Report
            </Button>
          </div>
        ) : (
          <div className='space-y-4'>
            {renderFormattedAnalysis()}

            {/* Additional visualizations */}
            {analysis.mainThemes && analysis.mainThemes.length > 0 && (
              <div className='mt-6'>
                <h3 className='font-semibold mb-2'>Key Themes</h3>
                <div className='flex flex-wrap gap-2'>
                  {analysis.mainThemes
                    .slice(0, 10)
                    .map((theme: any, idx: number) => (
                      <span
                        key={idx}
                        className='px-3 py-1 bg-primary/10 rounded-full text-sm'
                      >
                        {theme.theme} ({theme.percentage.toFixed(1)}%)
                      </span>
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

export default AIAnalysisReport
