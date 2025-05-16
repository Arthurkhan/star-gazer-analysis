import React, { useState } from 'react';
import { DownloadIcon, FileTextIcon, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { EnhancedAnalysis } from '@/types/dataAnalysis';
import { generatePDF, exportToCSV, ExportOptions } from '@/services/exportService';
import { BusinessType } from '@/types/businessTypes';

interface ExportButtonProps {
  businessName: string;
  businessType: BusinessType;
  data: EnhancedAnalysis;
  dateRange?: { start: Date; end: Date };
  disabled?: boolean;
}

export function ExportButton({
  businessName,
  businessType,
  data,
  dateRange,
  disabled = false
}: ExportButtonProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<'pdf' | 'csv'>('pdf');
  
  // Export options
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    businessName,
    businessType,
    includeCharts: true,
    includeTables: true,
    includeRecommendations: true,
    dateRange,
    brandingColor: '#3B82F6'
  });
  
  const handleExport = async () => {
    setIsExporting(true);
    
    try {
      if (exportFormat === 'pdf') {
        // Generate PDF file
        const pdfDoc = generatePDF({
          historicalTrends: data.historicalTrends, 
          reviewClusters: data.reviewClusters,
          temporalPatterns: data.temporalPatterns,
          seasonalPatterns: data.seasonalAnalysis,
          insights: data.insights,
          recommendations: (data as any).recommendations
        }, exportOptions);
        
        // Save the PDF
        const filename = `${businessName.replace(/\s+/g, '-')}-analysis-${new Date().toISOString().split('T')[0]}.pdf`;
        pdfDoc.save(filename);
      } else {
        // Export to CSV
        const csvContent = exportToCSV({
          historicalTrends: data.historicalTrends, 
          reviewClusters: data.reviewClusters,
          temporalPatterns: data.temporalPatterns,
          seasonalPatterns: data.seasonalAnalysis,
          insights: data.insights,
          recommendations: (data as any).recommendations
        }, exportOptions);
        
        // Create a blob and download
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `${businessName.replace(/\s+/g, '-')}-analysis-${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      console.error('Export error:', error);
      // Could add error handling UI here
    } finally {
      setIsExporting(false);
      setShowDialog(false);
    }
  };
  
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" disabled={disabled}>
            <DownloadIcon className="mr-2 h-4 w-4" />
            Export
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Export Options</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => {
            setExportFormat('pdf');
            setShowDialog(true);
          }}>
            <FileTextIcon className="mr-2 h-4 w-4" />
            Export as PDF
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => {
            setExportFormat('csv');
            setShowDialog(true);
          }}>
            <FileTextIcon className="mr-2 h-4 w-4" />
            Export as CSV
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Export {exportFormat.toUpperCase()} Report</DialogTitle>
            <DialogDescription>
              Customize your export options below
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="title" className="text-right">
                Title
              </Label>
              <Input
                id="title"
                placeholder="Custom report title"
                className="col-span-3"
                value={exportOptions.customTitle || `${businessName} - Review Analysis`}
                onChange={(e) => setExportOptions({
                  ...exportOptions,
                  customTitle: e.target.value
                })}
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="color" className="text-right">
                Brand Color
              </Label>
              <div className="col-span-3 flex items-center gap-2">
                <Input
                  id="color"
                  type="color"
                  className="w-12 h-10"
                  value={exportOptions.brandingColor}
                  onChange={(e) => setExportOptions({
                    ...exportOptions,
                    brandingColor: e.target.value
                  })}
                />
                <span className="text-sm text-muted-foreground">
                  Used for headers and accent colors
                </span>
              </div>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">
                Content
              </Label>
              <div className="col-span-3 space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="includeCharts"
                    checked={exportOptions.includeCharts}
                    onCheckedChange={(checked) => setExportOptions({
                      ...exportOptions,
                      includeCharts: checked as boolean
                    })}
                  />
                  <Label htmlFor="includeCharts">Include Charts</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="includeTables"
                    checked={exportOptions.includeTables}
                    onCheckedChange={(checked) => setExportOptions({
                      ...exportOptions,
                      includeTables: checked as boolean
                    })}
                  />
                  <Label htmlFor="includeTables">Include Tables</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="includeRecommendations"
                    checked={exportOptions.includeRecommendations}
                    onCheckedChange={(checked) => setExportOptions({
                      ...exportOptions,
                      includeRecommendations: checked as boolean
                    })}
                  />
                  <Label htmlFor="includeRecommendations">Include Recommendations</Label>
                </div>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleExport} disabled={isExporting}>
              {isExporting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <DownloadIcon className="mr-2 h-4 w-4" />
                  Export {exportFormat.toUpperCase()}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default ExportButton;
