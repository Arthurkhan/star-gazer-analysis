
import React from 'react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

interface AnalysisAlertSectionProps {
  overallAnalysis: string;
  loading: boolean;
  error: string | null;
  aiProvider?: string;
  aiModel?: string;
  ratingBreakdown?: { rating: number; count: number; percentage: number }[];
  languageDistribution?: { language: string; count: number; percentage: number }[];
}

const AnalysisAlertSection: React.FC<AnalysisAlertSectionProps> = ({
  overallAnalysis,
  loading,
  error,
  aiProvider = 'AI',
  aiModel = '',
  ratingBreakdown,
  languageDistribution,
}) => {
  // Function to format analysis for display
  const formatAnalysisForDisplay = (analysis: string) => {
    if (!analysis) return null

    // Split sections by emoji headers
    const sections = analysis.split(/\n\n(?=📊|📈|🗣️|💬|🌍|🎯)/g)

    return sections.map((section, index) => {
      // Check if the section has an emoji header
      const hasEmojiHeader = /^(📊|📈|🗣️|💬|🌍|🎯)/.test(section.trim())

      if (!hasEmojiHeader) return <p key={index} className="mb-4">{section}</p>

      // Get the section title
      const [title, ...content] = section.split('\n')

      return (
        <div key={index} className="mb-4">
          <h3 className="text-lg font-semibold mb-2">{title}</h3>
          <div className="pl-4">
            {content.map((line, i) => {
              // Handle bullet points
              if (line.trim().startsWith('-') || line.trim().startsWith('•')) {
                return <p key={i} className="mb-1">{line}</p>
              }
              // Handle numbered lists
              else if (/^\d+\./.test(line.trim())) {
                return <p key={i} className="mb-1">{line}</p>
              }
              // Handle subheadings
              else if (line.trim().endsWith(':')) {
                return <p key={i} className="font-medium mt-2 mb-1">{line}</p>
              }
              // Regular text
              else if (line.trim()) {
                return <p key={i} className="mb-1">{line}</p>
              }
              return null
            })}
          </div>
        </div>
      )
    })
  }

  // Format rating breakdowns as a horizontal bar chart
  const renderRatingBreakdown = () => {
    if (!ratingBreakdown || ratingBreakdown.length === 0) return null

    return (
      <div className="mt-4 mb-6">
        <h3 className="text-lg font-semibold mb-3">Rating Breakdown</h3>
        <div className="space-y-2">
          {ratingBreakdown.map((item) => (
            <div key={item.rating} className="flex items-center">
              <div className="w-16 flex items-center">
                <span className="text-sm font-medium">{item.rating}★</span>
              </div>
              <div className="flex-1 h-5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-yellow-400"
                  style={{ width: `${Math.max(item.percentage, 2)}%` }}
                />
              </div>
              <div className="w-20 ml-2 text-sm">
                {item.count} ({Math.round(item.percentage)}%)
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Format language distribution
  const renderLanguageDistribution = () => {
    if (!languageDistribution || languageDistribution.length === 0) return null

    return (
      <div className="mt-4 mb-6">
        <h3 className="text-lg font-semibold mb-3">Language Distribution</h3>
        <div className="space-y-2">
          {languageDistribution.slice(0, 5).map((item) => (
            <div key={item.language} className="flex items-center">
              <div className="w-24 flex items-center">
                <span className="text-sm font-medium truncate">{item.language}</span>
              </div>
              <div className="flex-1 h-5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-400"
                  style={{ width: `${Math.max(item.percentage, 2)}%` }}
                />
              </div>
              <div className="w-20 ml-2 text-sm">
                {item.count} ({Math.round(item.percentage)}%)
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Analysis Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  if (!overallAnalysis && !loading) {
    return (
      <div className="text-center text-muted-foreground py-8">
        No analysis available. Click "Refresh Analysis" to generate insights.
      </div>
    )
  }

  return (
    <div className="prose prose-sm dark:prose-invert max-w-none">
      {overallAnalysis && (
        <>
          <div className="text-xs text-muted-foreground mb-2">
            Generated with {aiProvider.charAt(0).toUpperCase() + aiProvider.slice(1)} {aiModel}
          </div>

          {/* Show rating breakdown at the top */}
          {renderRatingBreakdown()}

          {/* Show language distribution */}
          {renderLanguageDistribution()}

          {/* Show the overall analysis */}
          <div className="whitespace-pre-line">{formatAnalysisForDisplay(overallAnalysis)}</div>
        </>
      )}
    </div>
  )
}

export default AnalysisAlertSection
