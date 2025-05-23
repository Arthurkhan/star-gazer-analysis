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
  FileSpreadsheet,
  AlertTriangle
} from 'lucide-react';
import { Review } from '@/types/reviews';
import { generateAnalysisSummary } from '@/utils/analysisUtils';
import { calculateSeasonalTrends, analyzeCustomerJourney, generateCompetitiveInsights } from '@/utils/performanceMetrics';
import { prepareExportData, generatePDFContent, generateExcelWorkbook, generateCSVContent, generateJSONContent, downloadFile, exportFormats, ExportConfig, defaultExportConfig } from '@/utils/exportUtils';
import { format } from 'date-fns';

interface ExportManagerProps {
  reviews: Review[];
  businessName: string;
  businessType: string;
}

export function ExportManager({ reviews, businessName, businessType }: ExportManagerProps) {
  const [config, setConfig] = useState<ExportConfig>(defaultExportConfig);
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
      // Prepare export data using the new utility
      const exportData = prepareExportData(reviews, analysisData, config);

      // Generate export based on format
      let content: string | Blob;
      let filename: string;
      let mimeType: string;

      switch (config.format) {
        case 'pdf':
          content = generatePDFContent(exportData, config);
          filename = `${businessName}-analysis-${format(new Date(), 'yyyy-MM-dd')}.pdf`;
          mimeType = exportFormats.pdf.mimeType;
          await generatePDFReport(content as string, filename);
          break;
        case 'excel':
          const workbook = generateExcelWorkbook(exportData, config);
          content = JSON.stringify(workbook, null, 2);
          filename = `${businessName}-analysis-${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
          mimeType = exportFormats.excel.mimeType;
          downloadFile(content, filename, mimeType);
          break;
        case 'json':
          content = generateJSONContent(exportData, config);
          filename = `${businessName}-analysis-${format(new Date(), 'yyyy-MM-dd')}.json`;
          mimeType = exportFormats.json.mimeType;
          downloadFile(content, filename, mimeType);
          break;
        case 'csv':
          content = generateCSVContent(reviews, config);
          filename = `${businessName}-reviews-${format(new Date(), 'yyyy-MM-dd')}.csv`;
          mimeType = exportFormats.csv.mimeType;
          downloadFile(content, filename, mimeType);
          break;
      }

      // Add to export history
      setExportHistory(prev => [{
        date: new Date().toISOString(),
        format: config.format.toUpperCase(),
        sections: Object.keys(config.sections).filter(key => config.sections[key as keyof typeof config.sections]),
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

  const generatePDFReport = async (htmlContent: string, filename: string) => {
    // Create a printable version
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 500);
    }
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
                {Object.entries(config.sections).map(([key, value]) => (
                  <div key={key} className="flex items-center space-x-2">
                    <Checkbox
                      id={key}
                      checked={value}
                      onCheckedChange={(checked) => updateConfig(`sections.${key}`, checked)}
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
                    value={config.branding.companyName || ''}
                    onChange={(e) => updateConfig('branding.companyName', e.target.value)}
                  />
                </div>
                
                <div>
                  <Label htmlFor="template">Template</Label>
                  <Select
                    value={config.template}
                    onValueChange={(value) => updateConfig('template', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="executive">Executive</SelectItem>
                      <SelectItem value="detailed">Detailed</SelectItem>
                      <SelectItem value="minimal">Minimal</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex flex-wrap gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="coverPage"
                    checked={config.sections.coverPage}
                    onCheckedChange={(checked) => updateConfig('sections.coverPage', checked)}
                  />
                  <Label htmlFor="coverPage">Include Cover Page</Label>
                </div>
              </div>
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
                  Object.values(config.sections).filter(Boolean).length
                } sections
              </AlertDescription>
            </Alert>

            <div className="border rounded-lg p-6 space-y-4">
              <div className="text-center border-b pb-4">
                <h2 className="text-xl font-bold">{config.branding.companyName || 'Business Analysis Report'}</h2>
                <p className="text-gray-600">Generated on {format(new Date(), 'PPP')}</p>
                <p className="text-sm text-gray-500">Business: {businessName}</p>
              </div>

              {config.sections.executiveSummary && (
                <div>
                  <h3 className="font-semibold">Executive Summary</h3>
                  <p className="text-sm text-gray-600">Business health score, key metrics, and performance overview</p>
                </div>
              )}

              {config.sections.charts && (
                <div>
                  <h3 className="font-semibold">Performance Charts</h3>
                  <p className="text-sm text-gray-600">Visual representations of trends and patterns</p>
                </div>
              )}

              {config.sections.detailedAnalysis && (
                <div>
                  <h3 className="font-semibold">Detailed Analysis</h3>
                  <p className="text-sm text-gray-600">In-depth analysis of customer feedback and performance</p>
                </div>
              )}

              {config.sections.recommendations && (
                <div>
                  <h3 className="font-semibold">Recommendations</h3>
                  <p className="text-sm text-gray-600">Actionable insights and improvement suggestions</p>
                </div>
              )}

              {config.sections.appendix && (
                <div>
                  <h3 className="font-semibold">Appendix</h3>
                  <p className="text-sm text-gray-600">Additional data and methodology notes</p>
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