import React from 'react'

/**
 * Theme utility functions for handling dark/light mode in charts and tooltips
 */

/**
 * Detects if the current theme is dark mode
 * @returns {boolean} true if dark mode is active, false otherwise
 */
export const isDarkMode = (): boolean => {
  return document.documentElement.classList.contains('dark')
}

/**
 * Returns appropriate tooltip styles based on current theme
 * @returns {object} CSS styles for tooltips that adapt to dark/light mode
 */
export const getTooltipStyles = () => {
  const isDark = isDarkMode()

  return {
    backgroundColor: isDark
      ? 'rgba(31, 41, 55, 0.95)'
      : 'rgba(255, 255, 255, 0.95)', // gray-800 : white
    color: isDark ? 'rgba(249, 250, 251, 1)' : 'rgba(17, 24, 39, 1)', // gray-50 : gray-900
    border: `1px solid ${isDark ? 'rgba(75, 85, 99, 1)' : 'rgba(229, 231, 235, 1)'}`, // gray-600 : gray-200
    borderRadius: '6px',
    boxShadow: isDark
      ? '0 4px 12px rgba(0, 0, 0, 0.3)'
      : '0 4px 12px rgba(0, 0, 0, 0.1)',
    fontSize: '14px',
    padding: '8px 12px',
  }
}

/**
 * Returns CSS classes for tooltip styling that work with Tailwind CSS
 * @returns {string} Tailwind CSS classes for tooltip styling
 */
export const getTooltipClasses = (): string => {
  return 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-50 border border-gray-200 dark:border-gray-600 rounded-md shadow-lg'
}

/**
 * Custom tooltip component props interface
 */
export interface CustomTooltipProps {
  active?: boolean
  payload?: any[]
  label?: string
  formatter?: (value: any, name: string) => [string, string]
  labelFormatter?: (label: string) => string
}

/**
 * Generic custom tooltip component for charts
 * @param {CustomTooltipProps} props - Tooltip props
 * @returns {JSX.Element | null} Custom tooltip component
 */
export const CustomTooltip: React.FC<CustomTooltipProps> = ({
  active,
  payload,
  label,
  formatter,
  labelFormatter,
}) => {
  if (!active || !payload || !payload.length) {
    return null
  }

  return (
    <div className={getTooltipClasses()}>
      {label && (
        <p className='font-medium text-gray-900 dark:text-gray-50 mb-2'>
          {labelFormatter ? labelFormatter(label) : label}
        </p>
      )}
      {payload.map((entry, index) => (
        <div key={index} className='flex items-center justify-between gap-2'>
          <div className='flex items-center gap-2'>
            <div
              className='w-3 h-3 rounded-sm'
              style={{ backgroundColor: entry.color }}
            />
            <span className='text-sm text-gray-700 dark:text-gray-300'>
              {entry.name}:
            </span>
          </div>
          <span className='text-sm font-medium text-gray-900 dark:text-gray-50'>
            {formatter ? formatter(entry.value, entry.name)[0] : entry.value}
          </span>
        </div>
      ))}
    </div>
  )
}
