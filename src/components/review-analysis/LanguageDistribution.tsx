
import React, { useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { CustomPieTooltip } from "./CustomTooltips";
import { Review } from "@/types/reviews";
import { countReviewsByLanguage } from "@/utils/dataUtils";
import { renderActiveShape } from "./PieChartRenderer";

// Enhanced colors for pie chart with better contrast
const COLORS = [
  '#6E59A5', // Dark Purple
  '#9b87f5', // Primary Purple
  '#0EA5E9', // Ocean Blue
  '#10B981', // Green
  '#F97316', // Bright Orange
  '#D946EF', // Magenta Pink
  '#8B5CF6', // Vivid Purple
  '#0088FE', // Bright Blue
  '#33C3F0', // Sky Blue
  '#D3E4FD', // Soft Blue
  '#FFDEE2', // Soft Pink
  '#FEC6A1', // Soft Orange
  '#FEF7CD', // Soft Yellow
  '#F2FCE2'  // Soft Green
];

// Function to group languages with less than 1% into "Other"
const groupMinorLanguages = (languageData: { name: string; value: number }[], totalReviews: number) => {
  const threshold = totalReviews * 0.01; // 1% threshold
  
  const majorLanguages = languageData.filter(lang => lang.value >= threshold);
  const minorLanguages = languageData.filter(lang => lang.value < threshold);
  
  // Only create an "Other" category if there are minor languages
  if (minorLanguages.length > 0) {
    const otherValue = minorLanguages.reduce((sum, lang) => sum + lang.value, 0);
    
    // Create a list of minor language names for the tooltip
    const otherLanguageNames = minorLanguages.map(lang => `${lang.name} (${lang.value})`).join(', ');
    
    return [
      ...majorLanguages,
      { 
        name: 'Other', 
        value: otherValue,
        languages: minorLanguages,
        tooltip: otherLanguageNames
      }
    ];
  }
  
  return languageData;
};

interface LanguageDistributionProps {
  reviews: Review[];
}

const LanguageDistribution: React.FC<LanguageDistributionProps> = ({ reviews }) => {
  const [activePieIndex, setActivePieIndex] = useState(0);
  
  // Language distribution with grouping for small percentages
  const totalReviews = reviews.length;
  const rawLanguageData = countReviewsByLanguage(reviews);
  const languageData = groupMinorLanguages(rawLanguageData, totalReviews);
  
  // Add total count to each language data item for percentage calculation in tooltip
  const languageDataWithTotal = languageData.map(item => ({
    ...item,
    _total: totalReviews
  }));

  return (
    <div>
      <h3 className="text-lg font-medium mb-4 text-gray-900 dark:text-white">
        Review Languages
      </h3>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              activeIndex={activePieIndex}
              activeShape={renderActiveShape}
              data={languageDataWithTotal}
              cx="50%"
              cy="50%"
              innerRadius={65}
              outerRadius={90}
              paddingAngle={2}
              dataKey="value"
              onMouseEnter={(_, index) => setActivePieIndex(index)}
              className="dark:fill-white"
              stroke="#ffffff"
              strokeWidth={2}
            >
              {languageDataWithTotal.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={COLORS[index % COLORS.length]} 
                  style={{ filter: 'drop-shadow(0px 2px 3px rgba(0, 0, 0, 0.2))' }}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomPieTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      {languageDataWithTotal.length > 0 && (
        <div className="flex flex-wrap justify-center gap-3 mt-2">
          {languageDataWithTotal.slice(0, 5).map((entry, index) => (
            <div 
              key={`legend-${index}`} 
              className="flex items-center gap-1.5 text-xs text-gray-700 dark:text-white"
            >
              <div 
                className="w-3 h-3 rounded-sm" 
                style={{ backgroundColor: COLORS[index % COLORS.length] }}
              />
              <span>{entry.name}</span>
            </div>
          ))}
          {languageDataWithTotal.length > 5 && (
            <div className="text-xs text-gray-700 dark:text-white">
              + {languageDataWithTotal.length - 5} more
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LanguageDistribution;
