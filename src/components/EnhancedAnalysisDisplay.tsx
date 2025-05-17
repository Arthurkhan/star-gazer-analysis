
// src/components/EnhancedAnalysisDisplay.tsx
import React from 'react';
import { Info } from 'lucide-react'; 
import { Card } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { EnhancedAnalysis } from '@/types/dataAnalysis';
import { safeGet } from '@/utils/safeAccess';

interface EnhancedAnalysisDisplayProps {
  analysis: EnhancedAnalysis | undefined;
  className?: string;
}

export const EnhancedAnalysisDisplay: React.FC<EnhancedAnalysisDisplayProps> = ({ analysis, className = '' }) => {
  if (!analysis) {
    return (
      <Card className={`p-4 ${className}`}>
        <div className="text-gray-500 italic text-center">
          No enhanced analysis available
        </div>
      </Card>
    );
  }

  return (
    <Card className={`p-4 ${className}`}>
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Enhanced Analysis</h3>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-5 w-5 text-gray-500 cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-md">
                <p>Enhanced analysis provides deeper insights using advanced NLP techniques</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        
        {/* Main metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <MetricCard 
            title="Customer Satisfaction" 
            value={safeGet(analysis, 'customerSatisfaction', 0)}
            valueFormatter={(v) => `${(v * 100).toFixed(1)}%`}
          />
          <MetricCard 
            title="Trending Topics" 
            value={safeGet(analysis, 'trendingTopics', []).length}
            valueFormatter={(v) => `${v} Topics`}
          />
          <MetricCard 
            title="Actionable Insights" 
            value={safeGet(analysis, 'actionableInsights', []).length}
            valueFormatter={(v) => `${v} Insights`}
          />
        </div>
        
        {/* Trending Topics */}
        {analysis.trendingTopics && analysis.trendingTopics.length > 0 && (
          <div className="mt-2">
            <h4 className="text-md font-medium mb-2">Trending Topics</h4>
            <div className="flex flex-wrap gap-2">
              {analysis.trendingTopics.map((topic, index) => (
                <span 
                  key={index} 
                  className="px-2 py-1 bg-blue-100 dark:bg-blue-900 rounded-full text-sm"
                >
                  {topic}
                </span>
              ))}
            </div>
          </div>
        )}
        
        {/* Actionable Insights */}
        {analysis.actionableInsights && analysis.actionableInsights.length > 0 && (
          <div className="mt-2">
            <h4 className="text-md font-medium mb-2">Actionable Insights</h4>
            <ul className="list-disc list-inside">
              {analysis.actionableInsights.map((insight, index) => (
                <li key={index} className="text-sm">{insight}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </Card>
  );
};

interface MetricCardProps {
  title: string;
  value: number;
  valueFormatter: (value: number) => string;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, valueFormatter }) => {
  return (
    <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
      <div className="text-sm text-gray-500 dark:text-gray-400">{title}</div>
      <div className="text-xl font-semibold mt-1">{valueFormatter(value)}</div>
    </div>
  );
};

export default EnhancedAnalysisDisplay;
