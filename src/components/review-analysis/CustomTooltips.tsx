
import React from "react";

// Custom tooltip for the pie chart with improved dark mode text
export const CustomPieTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white dark:bg-gray-800 p-4 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 text-sm">
        <p className="font-semibold text-gray-900 dark:text-white mb-1">{data.name}</p>
        <p className="text-gray-800 dark:text-gray-200">{`Reviews: ${data.value}`}</p>
        <p className="text-gray-800 dark:text-gray-200">{`Percentage: ${(data.value / data._total * 100).toFixed(1)}%`}</p>
        {data.name === 'Other' && data.tooltip && (
          <div className="mt-2 border-t pt-2 border-gray-200 dark:border-gray-700">
            <p className="font-semibold text-xs text-gray-900 dark:text-white">Includes:</p>
            <p className="text-xs text-gray-800 dark:text-gray-200">{data.tooltip}</p>
          </div>
        )}
      </div>
    );
  }
  return null;
};

// Custom Treemap tooltip for common terms
export const CustomTermsTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white dark:bg-gray-800 p-3 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 text-sm">
        <p className="font-semibold text-gray-900 dark:text-white">{data.category || 'Uncategorized'}</p>
        <p className="text-gray-900 dark:text-white font-medium">{data.name}</p>
        <p className="text-gray-600 dark:text-gray-300">Mentioned in {data.value} reviews</p>
      </div>
    );
  }
  return null;
};
