import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Download, 
  FileText, 
  Table, 
  Image, 
  Calendar, 
  Settings,
  CheckCircle,
  Clock,
  FileImage,
  FileSpreadsheet
} from 'lucide-react';
import { Review } from '@/types/reviews';
import { generateAnalysisSummary } from '@/utils/analysisUtils';
import { calculateSeasonalTrends, analyzeCustomerJourney, generateCompetitiveInsights } from '@/utils/performanceMetrics';
import { format } from 'date-fns';

interface ExportManagerProps {
  reviews: Review[];
  businessName: string;
  businessType: string;
}

interface ExportConfig {
  format: 'pdf' | 'excel' | 'json' | 'csv';
  includeSections: {
    summary: boolean;
    charts: boolean;
    recommendations: boolean;
    rawData: boolean;
    trends: boolean;
    competitive: boolean;
  };
  customization: {
    title: string;
    subtitle: string;
    includeCompanyLogo: boolean;
    includeDate: boolean;
    includeWatermark: boolean;
  };
  scheduling: {
    enabled: boolean;
    frequency: 'weekly' | 'monthly' | 'quarterly';
    recipients: string[];
  };
}

const defaultConfig: ExportConfig = {
  format: 'pdf',
  includeSections: {
    summary: true,
    charts: true,
    recommendations: true,
    rawData: false,
    trends: true,
    competitive: true
  },
  customization: {
    title: 'Business Analysis Report',
    subtitle: 'Customer Review Analysis & Insights',
    includeCompanyLogo: false,
    includeDate: true,
    includeWatermark: false
  },
  scheduling: {
    enabled: false,
    frequency: 'monthly',
    recipients: []
  }
};

export function ExportManager({ reviews, businessName, businessType }: ExportManagerProps) {
  const [config, setConfig] = useState<ExportConfig>(defaultConfig);
  const [isExporting, setIsExporting] = useState(false);
  const [exportHistory, setExportHistory] = useState<Array<{
    date: string;
    format: string;
    sections: string[];
    status: 'success' | 'error';
    downloadUrl?: string;
  }>>([]);

  // Generate data for export
  const analysisData = generateAnalysisSummary(reviews, businessName);
  const seasonalTrends = calculateSeasonalTrends(reviews);
  const customerJourneys = analyzeCustomerJourney(reviews);
  const competitiveInsights = generateCompetitiveInsights(reviews, businessType);

  const handleExport = async () => {
    setIsExporting(true);
    
    try {
      // Prepare export data based on configuration
      const exportData = {
        metadata: {
          title: config.customization.title,
          subtitle: config.customization.subtitle,
          businessName,
          businessType,
          generatedAt: new Date().toISOString(),
          totalReviews: reviews.length,
          dateRange: {
            from: reviews.length > 0 ? reviews[0].publishedAtDate : null,
            to: reviews.length > 0 ? reviews[reviews.length - 1].publishedAtDate : null
          }
        },
        sections: {
          ...(config.includeSections.summary && { summary: analysisData }),
          ...(config.includeSections.trends && { trends: seasonalTrends }),
          ...(config.includeSections.competitive && { competitive: competitiveInsights }),
          ...(config.includeSections.rawData && { rawData: reviews })
        }
      };

      // Generate export based on format
      switch (config.format) {
        case 'pdf':
          await generatePDFReport(exportData);
          break;
        case 'excel':
          await generateExcelReport(exportData);
          break;
        case 'json':
          await generateJSONReport(exportData);
          break;
        case 'csv':
          await generateCSVReport(exportData);
          break;
      }

      // Add to export history
      setExportHistory(prev => [{
        date: new Date().toISOString(),
        format: config.format.toUpperCase(),
        sections: Object.keys(config.includeSections).filter(key => config.includeSections[key as keyof typeof config.includeSections]),
        status: 'success'
      }, ...prev.slice(0, 9)]); // Keep last 10 exports

    } catch (error) {
      console.error('Export failed:', error);
      setExportHistory(prev => [{
        date: new Date().toISOString(),
        format: config.format.toUpperCase(),
        sections: [],
        status: 'error'
      }, ...prev.slice(0, 9)]);
    } finally {
      setIsExporting(false);
    }
  };

  const generatePDFReport = async (data: any) => {
    // This would integrate with a PDF generation library like jsPDF or Puppeteer
    // For now, we'll create a basic implementation
    const reportContent = generateReportHTML(data);
    
    // Create a printable version
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(reportContent);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 500);
    }
  };

  const generateExcelReport = async (data: any) => {
    // Convert data to Excel format
    const workbook = {
      SheetNames: ['Summary', 'Trends', 'Raw Data'],
      Sheets: {
        'Summary': generateExcelSheet(data.sections.summary),
        'Trends': generateExcelSheet(data.sections.trends),
        'Raw Data': generateExcelSheet(data.sections.rawData)
      }
    };

    // Create and download Excel file
    const excelBlob = new Blob([JSON.stringify(workbook, null, 2)], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
    downloadFile(excelBlob, `${businessName}-analysis-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
  };

  const generateJSONReport = async (data: any) => {
    const jsonBlob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    downloadFile(jsonBlob, `${businessName}-analysis-${format(new Date(), 'yyyy-MM-dd')}.json`);
  };

  const generateCSVReport = async (data: any) => {
    const csvContent = convertToCSV(data.sections.rawData || reviews);
    const csvBlob = new Blob([csvContent], { type: 'text/csv' });
    downloadFile(csvBlob, `${businessName}-reviews-${format(new Date(), 'yyyy-MM-dd')}.csv`);
  };

  const generateReportHTML = (data: any) => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${data.metadata.title}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .section { margin-bottom: 30px; }
          .chart-placeholder { background: #f0f0f0; padding: 20px; text-align: center; margin: 20px 0; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
          @media print { .no-print { display: none; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${data.metadata.title}</h1>
          <h2>${data.metadata.subtitle}</h2>
          <p>Business: ${data.metadata.businessName}</p>
          <p>Generated: ${format(new Date(data.metadata.generatedAt), 'PPP')}</p>
        </div>

        ${config.includeSections.summary ? `
          <div class="section">
            <h2>Executive Summary</h2>
            <p>Total Reviews: ${data.metadata.totalReviews}</p>
            <p>Business Health Score: ${data.sections.summary?.healthScore?.overall || 'N/A'}</p>
          </div>
        ` : ''}

        ${config.includeSections.charts ? `
          <div class="section">
            <h2>Performance Charts</h2>
            <div class="chart-placeholder">
              [Chart: Rating Trends Over Time]
            </div>
            <div class="chart-placeholder">
              [Chart: Review Volume by Month]
            </div>
          </div>
        ` : ''}

        ${config.includeSections.trends ? `
          <div class="section">
            <h2>Seasonal Trends</h2>
            <table>
              <tr><th>Period</th><th>Avg Rating</th><th>Review Count</th><th>Trend</th></tr>
              ${data.sections.trends?.map((trend: any) => `
                <tr>
                  <td>${trend.period}</td>
                  <td>${trend.avgRating?.toFixed(1) || 'N/A'}</td>
                  <td>${trend.reviewCount || 'N/A'}</td>
                  <td>${trend.trendDirection || 'N/A'}</td>
                </tr>
              `).join('') || ''}
            </table>
          </div>
        ` : ''}

        <div class="section">
          <p><small>Generated by Star-Gazer Analysis Platform</small></p>
        </div>
      </body>
      </html>
    `;
  };

  const generateExcelSheet = (data: any) => {
    // Basic Excel sheet structure
    if (Array.isArray(data)) {
      return data.map((item, index) => ({ ...item, row: index + 1 }));
    }
    return [data];
  };

  const convertToCSV = (data: Review[]) => {
    if (!data || data.length === 0) return '';
    
    const headers = ['Date', 'Rating', 'Customer', 'Review Text', 'Sentiment', 'Staff Mentioned', 'Themes'];
    const rows = data.map(review => [
      review.publishedAtDate,
      review.stars,
      review.name || '',
      `"${(review.text || '').replace(/"/g, '""')}"`,
      review.sentiment || '',
      review.staffMentioned || '',
      review.mainThemes || ''
    ]);
    
    return [headers, ...rows].map(row => row.join(',')).join('\n');
  };

  const downloadFile = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const updateConfig = (path: string, value: any) => {
    setConfig(prev => {
      const newConfig = { ...prev };
      const keys = path.split('.');
      let current = newConfig as any;
      
      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]];
      }
      
      current[keys[keys.length - 1]] = value;
      return newConfig;
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="h-5 w-5" />
          Export Manager
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="configuration">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="configuration">Configuration</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
            <TabsTrigger value="history">Export History</TabsTrigger>
          </TabsList>

          <TabsContent value="configuration" className="space-y-6">
            {/* Export Format */}
            <div>
              <Label className="text-base font-medium">Export Format</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
                {[
                  { value: 'pdf', label: 'PDF Report', icon: FileText },
                  { value: 'excel', label: 'Excel Workbook', icon: FileSpreadsheet },
                  { value: 'json', label: 'JSON Data', icon: FileText },
                  { value: 'csv', label: 'CSV Export', icon: Table }
                ].map(({ value, label, icon: Icon }) => (
                  <Button
                    key={value}
                    variant={config.format === value ? 'default' : 'outline'}
                    className="h-auto p-4 flex flex-col items-center gap-2"
                    onClick={() => updateConfig('format', value)}
                  >
                    <Icon className="h-6 w-6" />
                    <span className="text-sm">{label}</span>
                  </Button>
                ))}
              </div>
            </div>

            {/* Sections to Include */}
            <div>
              <Label className="text-base font-medium">Sections to Include</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-2">
                {Object.entries(config.includeSections).map(([key, value]) => (
                  <div key={key} className="flex items-center space-x-2">
                    <Checkbox
                      id={key}
                      checked={value}
                      onCheckedChange={(checked) => updateConfig(`includeSections.${key}`, checked)}
                    />
                    <Label htmlFor={key} className="capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Customization Options */}
            <div className="space-y-4">
              <Label className="text-base font-medium">Customization</Label>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Report Title</Label>
                  <Input
                    id="title"
                    value={config.customization.title}
                    onChange={(e) => updateConfig('customization.title', e.target.value)}
                  />
                </div>
                
                <div>
                  <Label htmlFor="subtitle">Subtitle</Label>
                  <Input
                    id="subtitle"
                    value={config.customization.subtitle}
                    onChange={(e) => updateConfig('customization.subtitle', e.target.value)}
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="includeDate"
                    checked={config.customization.includeDate}
                    onCheckedChange={(checked) => updateConfig('customization.includeDate', checked)}
                  />
                  <Label htmlFor="includeDate">Include Generation Date</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="includeWatermark"
                    checked={config.customization.includeWatermark}
                    onCheckedChange={(checked) => updateConfig('customization.includeWatermark', checked)}
                  />
                  <Label htmlFor="includeWatermark">Include Watermark</Label>
                </div>
              </div>
            </div>

            {/* Scheduled Exports */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="schedulingEnabled"
                  checked={config.scheduling.enabled}
                  onCheckedChange={(checked) => updateConfig('scheduling.enabled', checked)}
                />
                <Label htmlFor="schedulingEnabled" className="text-base font-medium">
                  Enable Scheduled Exports
                </Label>
              </div>
              
              {config.scheduling.enabled && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg">
                  <div>
                    <Label htmlFor="frequency">Frequency</Label>
                    <Select
                      value={config.scheduling.frequency}
                      onValueChange={(value) => updateConfig('scheduling.frequency', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="quarterly">Quarterly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="recipients">Email Recipients</Label>
                    <Textarea
                      id="recipients"
                      placeholder="Enter email addresses, one per line"
                      value={config.scheduling.recipients.join('\n')}
                      onChange={(e) => updateConfig('scheduling.recipients', e.target.value.split('\n').filter(Boolean))}
                      rows={3}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Export Button */}
            <div className="flex justify-end">
              <Button
                onClick={handleExport}
                disabled={isExporting}
                className="flex items-center gap-2"
              >
                {isExporting ? (
                  <>
                    <Clock className="h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4" />
                    Export {config.format.toUpperCase()}
                  </>
                )}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="preview" className="space-y-6">
            <Alert>
              <FileImage className="h-4 w-4" />
              <AlertDescription>
                Export Preview: {config.format.toUpperCase()} format with {
                  Object.values(config.includeSections).filter(Boolean).length
                } sections
              </AlertDescription>
            </Alert>

            <div className="border rounded-lg p-6 space-y-4">
              <div className="text-center border-b pb-4">
                <h2 className="text-xl font-bold">{config.customization.title}</h2>
                <p className="text-gray-600">{config.customization.subtitle}</p>
                <p className="text-sm text-gray-500">Business: {businessName}</p>
                {config.customization.includeDate && (
                  <p className="text-sm text-gray-500">Generated: {format(new Date(), 'PPP')}</p>
                )}
              </div>

              {config.includeSections.summary && (
                <div>
                  <h3 className="font-semibold">Executive Summary</h3>
                  <p className="text-sm text-gray-600">Business health score, key metrics, and performance overview</p>
                </div>
              )}

              {config.includeSections.charts && (
                <div>
                  <h3 className="font-semibold">Performance Charts</h3>
                  <p className="text-sm text-gray-600">Visual representations of trends and patterns</p>
                </div>
              )}

              {config.includeSections.trends && (
                <div>
                  <h3 className="font-semibold">Seasonal Trends</h3>
                  <p className="text-sm text-gray-600">Monthly and seasonal performance analysis</p>
                </div>
              )}

              {config.includeSections.competitive && (
                <div>
                  <h3 className="font-semibold">Competitive Analysis</h3>
                  <p className="text-sm text-gray-600">Industry benchmarks and positioning</p>
                </div>
              )}

              {config.includeSections.rawData && (
                <div>
                  <h3 className="font-semibold">Raw Data</h3>
                  <p className="text-sm text-gray-600">Complete review dataset</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            <div className="space-y-4">
              {exportHistory.length === 0 ? (
                <Alert>
                  <AlertDescription>
                    No exports generated yet. Create your first export to see history here.
                  </AlertDescription>
                </Alert>
              ) : (
                exportHistory.map((export_, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${
                        export_.status === 'success' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                      }`}>
                        {export_.status === 'success' ? (
                          <CheckCircle className="h-4 w-4" />
                        ) : (
                          <AlertTriangle className="h-4 w-4" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{export_.format} Export</p>
                        <p className="text-sm text-gray-600">
                          {format(new Date(export_.date), 'PPp')}
                        </p>
                        <div className="flex gap-1 mt-1">
                          {export_.sections.map(section => (
                            <Badge key={section} variant="outline" className="text-xs">
                              {section}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                    {export_.downloadUrl && (
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </Button>
                    )}
                  </div>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

export default ExportManager;
