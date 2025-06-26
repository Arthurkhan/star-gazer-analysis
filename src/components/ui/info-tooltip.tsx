import React from 'react'
import { Info } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { getTooltip } from '@/utils/tooltipContent'
import { cn } from '@/lib/utils'

interface InfoTooltipProps {
  content: string;
  tooltipPath?: string;
  className?: string;
  iconClassName?: string;
  side?: 'top' | 'right' | 'bottom' | 'left';
}

/**
 * InfoTooltip Component
 *
 * A reusable component that displays an info icon with a tooltip on hover.
 * Can use either direct content or fetch content from the centralized tooltip file.
 *
 * @param content - Direct tooltip content or tooltip path if tooltipPath is not provided
 * @param tooltipPath - Path to tooltip content in the centralized file (e.g., "overview.averageRating")
 * @param className - Additional classes for the wrapper
 * @param iconClassName - Additional classes for the info icon
 * @param side - Which side to display the tooltip (default: "top")
 */
export const InfoTooltip: React.FC<InfoTooltipProps> = ({
  content,
  tooltipPath,
  className,
  iconClassName,
  side = 'top',
}) => {
  // Get tooltip content from centralized file if path is provided
  const tooltipContent = tooltipPath ? getTooltip(tooltipPath) : content

  return (
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={cn(
              'inline-flex items-center justify-center cursor-help',
              className,
            )}
          >
            <Info
              className={cn(
                'h-3.5 w-3.5 text-white/70 hover:text-white transition-colors',
                iconClassName,
              )}
            />
          </span>
        </TooltipTrigger>
        <TooltipContent
          side={side}
          className="max-w-xs z-50 bg-gray-900 text-white border-gray-700"
        >
          <p className="text-sm">{tooltipContent}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

/**
 * TitleWithTooltip Component
 *
 * A convenience component for titles/headers with an info tooltip.
 * The tooltip appears in the top-right corner of the title.
 *
 * @param title - The title text
 * @param tooltipContent - Direct tooltip content
 * @param tooltipPath - Path to tooltip content in the centralized file
 * @param titleClassName - Additional classes for the title
 * @param className - Additional classes for the wrapper
 */
interface TitleWithTooltipProps {
  title: string;
  tooltipContent?: string;
  tooltipPath?: string;
  titleClassName?: string;
  className?: string;
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span';
}

export const TitleWithTooltip: React.FC<TitleWithTooltipProps> = ({
  title,
  tooltipContent,
  tooltipPath,
  titleClassName,
  className,
  as: Component = 'h3',
}) => {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Component className={cn('flex-1', titleClassName)}>
        {title}
      </Component>
      {(tooltipContent || tooltipPath) && (
        <InfoTooltip
          content={tooltipContent || ''}
          tooltipPath={tooltipPath}
          className="ml-1"
        />
      )}
    </div>
  )
}
