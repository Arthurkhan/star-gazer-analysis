import React, { useState } from 'react'
import { DownloadIcon, FileTextIcon, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import type { EnhancedAnalysis } from '@/types/dataAnalysis'
import {
  type ExportOptions,
  generateAndDownloadPDF,
  generateAndDownloadCSV,
} from '@/services/exportService'
import type { BusinessType } from '@/types/businessTypes'

interface ExportButtonProps {
  businessName: string
  businessType: BusinessType
  data: EnhancedAnalysis
  dateRange?: { start: Date; end: Date }
  disabled?: boolean
  asMenuItem?: boolean
}

export function ExportButton({
  businessName,
  businessType,
  data,
  dateRange,
  disabled = false,
  asMenuItem = false,
}: ExportButtonProps) {
  const [showDialog, setShowDialog] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [exportFormat, setExportFormat] = useState<'pdf' | 'csv'>('pdf')

  // Export options
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    businessName,
    businessType,
    includeCharts: true,
    includeTables: true,
    includeRecommendations: true,
    dateRange,
    brandingColor: '#3B82F6',
  })

  const handleExport = async () => {
    setIsExporting(true)

    try {
      // Prepare data for export
      const exportData = {
        historicalTrends: data.historicalTrends,
        reviewClusters: data.reviewClusters,
        temporalPatterns: data.temporalPatterns,
        seasonalAnalysis: data.seasonalAnalysis,
        insights: data.insights,
        recommendations: (data as any).recommendations,
      }

      if (exportFormat === 'pdf') {
        // Generate and download PDF using React-PDF
        await generateAndDownloadPDF(exportData, exportOptions)
      } else {
        // Generate and download CSV
        generateAndDownloadCSV(exportData, exportOptions)
      }
    } catch (error) {
      console.error('Export error:', error)
      // Could add error handling UI here - for now just log the error
    } finally {
      setIsExporting(false)
      setShowDialog(false)
    }
  }

  if (asMenuItem) {
    return (
      <>
        <div
          className='w-full cursor-pointer'
          onClick={() => {
            setExportFormat('pdf')
            setShowDialog(true)
          }}
        >
          <DownloadIcon className='w-4 h-4 mr-2 inline' />
          Export Report
        </div>

        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent className='max-w-[95vw] sm:max-w-lg'>
            <DialogHeader>
              <DialogTitle>
                Export {exportFormat.toUpperCase()} Report
              </DialogTitle>
              <DialogDescription>
                Customize your export options below
              </DialogDescription>
            </DialogHeader>

            <div className='grid gap-4 py-4'>
              <div className='grid grid-cols-1 sm:grid-cols-4 items-center gap-4'>
                <Label htmlFor='title' className='sm:text-right'>
                  Title
                </Label>
                <Input
                  id='title'
                  placeholder='Custom report title'
                  className='col-span-1 sm:col-span-3'
                  value={
                    exportOptions.customTitle ||
                    `${businessName} - Review Analysis`
                  }
                  onChange={e =>
                    setExportOptions({
                      ...exportOptions,
                      customTitle: e.target.value,
                    })
                  }
                />
              </div>

              <div className='grid grid-cols-1 sm:grid-cols-4 items-center gap-4'>
                <Label htmlFor='color' className='sm:text-right'>
                  Brand Color
                </Label>
                <div className='col-span-1 sm:col-span-3 flex items-center gap-2'>
                  <Input
                    id='color'
                    type='color'
                    className='w-12 h-10'
                    value={exportOptions.brandingColor}
                    onChange={e =>
                      setExportOptions({
                        ...exportOptions,
                        brandingColor: e.target.value,
                      })
                    }
                  />
                  <span className='text-sm text-muted-foreground'>
                    Used for headers and accent colors
                  </span>
                </div>
              </div>

              <div className='grid grid-cols-1 sm:grid-cols-4 items-start gap-4'>
                <Label className='sm:text-right pt-2'>Format</Label>
                <div className='col-span-1 sm:col-span-3 space-y-2'>
                  <div className='flex items-center space-x-2'>
                    <input
                      type='radio'
                      id='pdf'
                      value='pdf'
                      checked={exportFormat === 'pdf'}
                      onChange={() => setExportFormat('pdf')}
                    />
                    <Label htmlFor='pdf'>PDF (Recommended)</Label>
                  </div>
                  <div className='flex items-center space-x-2'>
                    <input
                      type='radio'
                      id='csv'
                      value='csv'
                      checked={exportFormat === 'csv'}
                      onChange={() => setExportFormat('csv')}
                    />
                    <Label htmlFor='csv'>CSV (Data only)</Label>
                  </div>
                </div>
              </div>

              <div className='grid grid-cols-1 sm:grid-cols-4 items-start gap-4'>
                <Label className='sm:text-right pt-2'>Content</Label>
                <div className='col-span-1 sm:col-span-3 space-y-2'>
                  <div className='flex items-center space-x-2'>
                    <Checkbox
                      id='includeCharts'
                      checked={exportOptions.includeCharts}
                      onCheckedChange={checked =>
                        setExportOptions({
                          ...exportOptions,
                          includeCharts: checked as boolean,
                        })
                      }
                    />
                    <Label htmlFor='includeCharts'>Include Charts</Label>
                  </div>

                  <div className='flex items-center space-x-2'>
                    <Checkbox
                      id='includeTables'
                      checked={exportOptions.includeTables}
                      onCheckedChange={checked =>
                        setExportOptions({
                          ...exportOptions,
                          includeTables: checked as boolean,
                        })
                      }
                    />
                    <Label htmlFor='includeTables'>Include Tables</Label>
                  </div>

                  <div className='flex items-center space-x-2'>
                    <Checkbox
                      id='includeRecommendations'
                      checked={exportOptions.includeRecommendations}
                      onCheckedChange={checked =>
                        setExportOptions({
                          ...exportOptions,
                          includeRecommendations: checked as boolean,
                        })
                      }
                    />
                    <Label htmlFor='includeRecommendations'>
                      Include Recommendations
                    </Label>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter className='flex-col sm:flex-row gap-2'>
              <Button
                variant='outline'
                onClick={() => setShowDialog(false)}
                className='w-full sm:w-auto'
              >
                Cancel
              </Button>
              <Button
                onClick={handleExport}
                disabled={isExporting}
                className='w-full sm:w-auto'
              >
                {isExporting ? (
                  <>
                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                    Exporting...
                  </>
                ) : (
                  <>
                    <DownloadIcon className='mr-2 h-4 w-4' />
                    Export {exportFormat.toUpperCase()}
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    )
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant='outline'
            disabled={disabled}
            size='icon'
            className='h-10 w-10'
          >
            <DownloadIcon className='h-5 w-5' />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end'>
          <DropdownMenuLabel>Export Options</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => {
              setExportFormat('pdf')
              setShowDialog(true)
            }}
          >
            <FileTextIcon className='mr-2 h-4 w-4' />
            Export as PDF
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              setExportFormat('csv')
              setShowDialog(true)
            }}
          >
            <FileTextIcon className='mr-2 h-4 w-4' />
            Export as CSV
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className='max-w-[95vw] sm:max-w-lg'>
          <DialogHeader>
            <DialogTitle>
              Export {exportFormat.toUpperCase()} Report
            </DialogTitle>
            <DialogDescription>
              Customize your export options below
            </DialogDescription>
          </DialogHeader>

          <div className='grid gap-4 py-4'>
            <div className='grid grid-cols-1 sm:grid-cols-4 items-center gap-4'>
              <Label htmlFor='title' className='sm:text-right'>
                Title
              </Label>
              <Input
                id='title'
                placeholder='Custom report title'
                className='col-span-1 sm:col-span-3'
                value={
                  exportOptions.customTitle ||
                  `${businessName} - Review Analysis`
                }
                onChange={e =>
                  setExportOptions({
                    ...exportOptions,
                    customTitle: e.target.value,
                  })
                }
              />
            </div>

            <div className='grid grid-cols-1 sm:grid-cols-4 items-center gap-4'>
              <Label htmlFor='color' className='sm:text-right'>
                Brand Color
              </Label>
              <div className='col-span-1 sm:col-span-3 flex items-center gap-2'>
                <Input
                  id='color'
                  type='color'
                  className='w-12 h-10'
                  value={exportOptions.brandingColor}
                  onChange={e =>
                    setExportOptions({
                      ...exportOptions,
                      brandingColor: e.target.value,
                    })
                  }
                />
                <span className='text-sm text-muted-foreground'>
                  Used for headers and accent colors
                </span>
              </div>
            </div>

            <div className='grid grid-cols-1 sm:grid-cols-4 items-start gap-4'>
              <Label className='sm:text-right pt-2'>Content</Label>
              <div className='col-span-1 sm:col-span-3 space-y-2'>
                <div className='flex items-center space-x-2'>
                  <Checkbox
                    id='includeCharts'
                    checked={exportOptions.includeCharts}
                    onCheckedChange={checked =>
                      setExportOptions({
                        ...exportOptions,
                        includeCharts: checked as boolean,
                      })
                    }
                  />
                  <Label htmlFor='includeCharts'>Include Charts</Label>
                </div>

                <div className='flex items-center space-x-2'>
                  <Checkbox
                    id='includeTables'
                    checked={exportOptions.includeTables}
                    onCheckedChange={checked =>
                      setExportOptions({
                        ...exportOptions,
                        includeTables: checked as boolean,
                      })
                    }
                  />
                  <Label htmlFor='includeTables'>Include Tables</Label>
                </div>

                <div className='flex items-center space-x-2'>
                  <Checkbox
                    id='includeRecommendations'
                    checked={exportOptions.includeRecommendations}
                    onCheckedChange={checked =>
                      setExportOptions({
                        ...exportOptions,
                        includeRecommendations: checked as boolean,
                      })
                    }
                  />
                  <Label htmlFor='includeRecommendations'>
                    Include Recommendations
                  </Label>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className='flex-col sm:flex-row gap-2'>
            <Button
              variant='outline'
              onClick={() => setShowDialog(false)}
              className='w-full sm:w-auto'
            >
              Cancel
            </Button>
            <Button
              onClick={handleExport}
              disabled={isExporting}
              className='w-full sm:w-auto'
            >
              {isExporting ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  Exporting...
                </>
              ) : (
                <>
                  <DownloadIcon className='mr-2 h-4 w-4' />
                  Export {exportFormat.toUpperCase()}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default ExportButton
