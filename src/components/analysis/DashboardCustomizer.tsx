import React, { useState, useMemo, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'
import { Slider } from '@/components/ui/slider'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Settings,
  Layout,
  Palette,
  Eye,
  EyeOff,
  Save,
  RotateCcw,
  Download,
  Upload,
  Grid3x3,
  BarChart3,
  PieChart,
  TrendingUp,
  Activity,
  Users,
  MessageSquare,
  Target,
  Zap,
  Star,
  Calendar,
  Filter,
  Search,
  DragDropHandlesIcon,
  Plus,
  Minus,
  Copy,
  Trash2,
  RefreshCw,
} from 'lucide-react'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'

// Widget types and configurations
interface WidgetConfig {
  id: string;
  type: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  category: 'analytics' | 'performance' | 'engagement' | 'operational';
  size: 'small' | 'medium' | 'large' | 'extra-large';
  minWidth: number;
  minHeight: number;
  configurable: boolean;
  settings?: Record<string, any>;
}

interface DashboardLayout {
  id: string;
  name: string;
  description: string;
  widgets: WidgetConfig[];
  columns: number;
  spacing: number;
  theme: 'light' | 'dark' | 'auto';
  customColors?: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
}

interface DashboardCustomizerProps {
  currentLayout: DashboardLayout;
  onLayoutChange: (layout: DashboardLayout) => void;
  onSaveTemplate: (template: DashboardLayout) => void;
  onLoadTemplate: (templateId: string) => void;
  availableTemplates: DashboardLayout[];
  className?: string;
}

// Available widget configurations
const AVAILABLE_WIDGETS: WidgetConfig[] = [
  {
    id: 'executive-summary',
    type: 'ExecutiveSummaryCard',
    title: 'Executive Summary',
    description: 'Business health score and key performance indicators',
    icon: BarChart3,
    category: 'analytics',
    size: 'large',
    minWidth: 400,
    minHeight: 300,
    configurable: true,
    settings: { showTrends: true, showBenchmarks: true },
  },
  {
    id: 'performance-metrics',
    type: 'PerformanceMetricsGrid',
    title: 'Performance Metrics',
    description: 'Detailed performance analytics and trends',
    icon: TrendingUp,
    category: 'performance',
    size: 'large',
    minWidth: 600,
    minHeight: 400,
    configurable: true,
    settings: { displayMode: 'grid', showComparisons: true },
  },
  {
    id: 'sentiment-analysis',
    type: 'SentimentAnalysisSection',
    title: 'Sentiment Analysis',
    description: 'Customer sentiment trends and distribution',
    icon: Activity,
    category: 'analytics',
    size: 'medium',
    minWidth: 400,
    minHeight: 250,
    configurable: true,
    settings: { showTimeline: true, showBreakdown: true },
  },
  {
    id: 'thematic-analysis',
    type: 'ThematicAnalysisSection',
    title: 'Thematic Analysis',
    description: 'Topic analysis and theme trends',
    icon: MessageSquare,
    category: 'engagement',
    size: 'medium',
    minWidth: 400,
    minHeight: 300,
    configurable: true,
    settings: { maxThemes: 10, showTrendingOnly: false },
  },
  {
    id: 'staff-insights',
    type: 'StaffInsightsSection',
    title: 'Staff Performance',
    description: 'Staff mentions and performance analysis',
    icon: Users,
    category: 'operational',
    size: 'medium',
    minWidth: 350,
    minHeight: 250,
    configurable: true,
    settings: { showExamples: true, showTraining: true },
  },
  {
    id: 'action-items',
    type: 'ActionItemsSection',
    title: 'Action Items',
    description: 'Prioritized recommendations and tasks',
    icon: Target,
    category: 'operational',
    size: 'large',
    minWidth: 500,
    minHeight: 350,
    configurable: true,
    settings: { showUrgentOnly: false, groupByPriority: true },
  },
  {
    id: 'interactive-charts',
    type: 'InteractiveCharts',
    title: 'Interactive Charts',
    description: 'Dynamic and interactive data visualizations',
    icon: PieChart,
    category: 'analytics',
    size: 'extra-large',
    minWidth: 700,
    minHeight: 500,
    configurable: true,
    settings: { defaultChart: 'ratingTrends', showControls: true },
  },
  {
    id: 'export-manager',
    type: 'ExportManager',
    title: 'Export Manager',
    description: 'Data export and report generation',
    icon: Download,
    category: 'operational',
    size: 'medium',
    minWidth: 400,
    minHeight: 300,
    configurable: true,
    settings: { quickExport: true, showHistory: true },
  },
  {
    id: 'rating-overview',
    type: 'RatingOverview',
    title: 'Rating Overview',
    description: 'Quick rating statistics and trends',
    icon: Star,
    category: 'performance',
    size: 'small',
    minWidth: 250,
    minHeight: 150,
    configurable: false,
  },
  {
    id: 'recent-reviews',
    type: 'RecentReviews',
    title: 'Recent Reviews',
    description: 'Latest customer reviews and feedback',
    icon: Calendar,
    category: 'engagement',
    size: 'medium',
    minWidth: 400,
    minHeight: 300,
    configurable: true,
    settings: { maxReviews: 5, showSentiment: true },
  },
]

// Predefined dashboard templates
const DEFAULT_TEMPLATES: DashboardLayout[] = [
  {
    id: 'executive-dashboard',
    name: 'Executive Dashboard',
    description: 'High-level overview for executives and managers',
    columns: 3,
    spacing: 16,
    theme: 'light',
    widgets: [
      AVAILABLE_WIDGETS.find(w => w.id === 'executive-summary')!,
      AVAILABLE_WIDGETS.find(w => w.id === 'performance-metrics')!,
      AVAILABLE_WIDGETS.find(w => w.id === 'action-items')!,
      AVAILABLE_WIDGETS.find(w => w.id === 'rating-overview')!,
    ],
  },
  {
    id: 'operational-dashboard',
    name: 'Operational Dashboard',
    description: 'Detailed operational insights for day-to-day management',
    columns: 2,
    spacing: 12,
    theme: 'light',
    widgets: [
      AVAILABLE_WIDGETS.find(w => w.id === 'staff-insights')!,
      AVAILABLE_WIDGETS.find(w => w.id === 'recent-reviews')!,
      AVAILABLE_WIDGETS.find(w => w.id === 'thematic-analysis')!,
      AVAILABLE_WIDGETS.find(w => w.id === 'sentiment-analysis')!,
      AVAILABLE_WIDGETS.find(w => w.id === 'export-manager')!,
    ],
  },
  {
    id: 'analytics-dashboard',
    name: 'Analytics Dashboard',
    description: 'Comprehensive analytics and data visualization',
    columns: 2,
    spacing: 20,
    theme: 'dark',
    widgets: [
      AVAILABLE_WIDGETS.find(w => w.id === 'interactive-charts')!,
      AVAILABLE_WIDGETS.find(w => w.id === 'sentiment-analysis')!,
      AVAILABLE_WIDGETS.find(w => w.id === 'thematic-analysis')!,
      AVAILABLE_WIDGETS.find(w => w.id === 'performance-metrics')!,
    ],
  },
  {
    id: 'minimal-dashboard',
    name: 'Minimal Dashboard',
    description: 'Clean and focused view with essential metrics only',
    columns: 4,
    spacing: 24,
    theme: 'auto',
    widgets: [
      AVAILABLE_WIDGETS.find(w => w.id === 'executive-summary')!,
      AVAILABLE_WIDGETS.find(w => w.id === 'rating-overview')!,
      AVAILABLE_WIDGETS.find(w => w.id === 'recent-reviews')!,
    ],
  },
]

export function DashboardCustomizer({
  currentLayout,
  onLayoutChange,
  onSaveTemplate,
  onLoadTemplate,
  availableTemplates = DEFAULT_TEMPLATES,
  className = '',
}: DashboardCustomizerProps) {
  const [activeTab, setActiveTab] = useState('layout')
  const [previewMode, setPreviewMode] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [unsavedChanges, setUnsavedChanges] = useState(false)
  const [customColors, setCustomColors] = useState(currentLayout.customColors || {
    primary: '#3b82f6',
    secondary: '#64748b',
    accent: '#10b981',
    background: '#ffffff',
    text: '#1f2937',
  })

  // Filter available widgets
  const filteredWidgets = useMemo(() => {
    return AVAILABLE_WIDGETS.filter(widget => {
      const matchesSearch = widget.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           widget.description.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesCategory = selectedCategory === 'all' || widget.category === selectedCategory
      return matchesSearch && matchesCategory
    })
  }, [searchTerm, selectedCategory])

  // Handle drag and drop for widget reordering
  const handleDragEnd = useCallback((result: any) => {
    if (!result.destination) return

    const newWidgets = Array.from(currentLayout.widgets)
    const [reorderedItem] = newWidgets.splice(result.source.index, 1)
    newWidgets.splice(result.destination.index, 0, reorderedItem)

    const updatedLayout = { ...currentLayout, widgets: newWidgets }
    onLayoutChange(updatedLayout)
    setUnsavedChanges(true)
  }, [currentLayout, onLayoutChange])

  // Add widget to dashboard
  const handleAddWidget = useCallback((widgetConfig: WidgetConfig) => {
    const updatedLayout = {
      ...currentLayout,
      widgets: [...currentLayout.widgets, { ...widgetConfig, id: `${widgetConfig.id}-${Date.now()}` }],
    }
    onLayoutChange(updatedLayout)
    setUnsavedChanges(true)
  }, [currentLayout, onLayoutChange])

  // Remove widget from dashboard
  const handleRemoveWidget = useCallback((widgetId: string) => {
    const updatedLayout = {
      ...currentLayout,
      widgets: currentLayout.widgets.filter(widget => widget.id !== widgetId),
    }
    onLayoutChange(updatedLayout)
    setUnsavedChanges(true)
  }, [currentLayout, onLayoutChange])

  // Update widget settings
  const handleUpdateWidgetSettings = useCallback((widgetId: string, settings: Record<string, any>) => {
    const updatedLayout = {
      ...currentLayout,
      widgets: currentLayout.widgets.map(widget =>
        widget.id === widgetId ? { ...widget, settings: { ...widget.settings, ...settings } } : widget,
      ),
    }
    onLayoutChange(updatedLayout)
    setUnsavedChanges(true)
  }, [currentLayout, onLayoutChange])

  // Update layout settings
  const handleLayoutSettingsChange = useCallback((key: string, value: any) => {
    const updatedLayout = { ...currentLayout, [key]: value }
    onLayoutChange(updatedLayout)
    setUnsavedChanges(true)
  }, [currentLayout, onLayoutChange])

  // Save current layout as template
  const handleSaveTemplate = useCallback(() => {
    const templateName = prompt('Enter template name:')
    if (templateName) {
      const template = {
        ...currentLayout,
        id: `custom-${Date.now()}`,
        name: templateName,
        description: `Custom template created on ${new Date().toLocaleDateString()}`,
      }
      onSaveTemplate(template)
      setUnsavedChanges(false)
    }
  }, [currentLayout, onSaveTemplate])

  // Load template
  const handleLoadTemplate = useCallback((templateId: string) => {
    if (unsavedChanges) {
      if (!confirm('You have unsaved changes. Are you sure you want to load a new template?')) {
        return
      }
    }
    onLoadTemplate(templateId)
    setUnsavedChanges(false)
  }, [unsavedChanges, onLoadTemplate])

  // Reset to default
  const handleResetToDefault = useCallback(() => {
    if (confirm('Reset to default layout? This will discard all customizations.')) {
      onLoadTemplate('executive-dashboard')
      setUnsavedChanges(false)
    }
  }, [onLoadTemplate])

  // Export/Import configuration
  const handleExportConfig = useCallback(() => {
    const configBlob = new Blob([JSON.stringify(currentLayout, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(configBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `dashboard-config-${currentLayout.name.replace(/\s+/g, '-').toLowerCase()}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }, [currentLayout])

  const handleImportConfig = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const config = JSON.parse(e.target?.result as string)
          onLayoutChange(config)
          setUnsavedChanges(true)
        } catch (error) {
          alert('Invalid configuration file')
        }
      }
      reader.readAsText(file)
    }
  }, [onLayoutChange])

  // Render widget configuration
  const renderWidgetConfig = (widget: WidgetConfig) => (
    <Card key={widget.id} className="mb-4">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <widget.icon className="h-4 w-4" />
            {widget.title}
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {widget.size}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleRemoveWidget(widget.id)}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      {widget.configurable && widget.settings && (
        <CardContent>
          <div className="space-y-3">
            {Object.entries(widget.settings).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between">
                <Label htmlFor={`${widget.id}-${key}`} className="text-xs capitalize">
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </Label>
                {typeof value === 'boolean' ? (
                  <Switch
                    id={`${widget.id}-${key}`}
                    checked={value}
                    onCheckedChange={(checked) =>
                      handleUpdateWidgetSettings(widget.id, { [key]: checked })
                    }
                  />
                ) : typeof value === 'number' ? (
                  <Input
                    id={`${widget.id}-${key}`}
                    type="number"
                    value={value}
                    onChange={(e) =>
                      handleUpdateWidgetSettings(widget.id, { [key]: parseInt(e.target.value) })
                    }
                    className="w-20"
                  />
                ) : (
                  <Input
                    id={`${widget.id}-${key}`}
                    value={value}
                    onChange={(e) =>
                      handleUpdateWidgetSettings(widget.id, { [key]: e.target.value })
                    }
                    className="w-32"
                  />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  )

  return (
    <div className={`space-y-6 ${className}`}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Dashboard Customizer
              {unsavedChanges && (
                <Badge variant="secondary" className="ml-2">
                  Unsaved Changes
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPreviewMode(!previewMode)}
              >
                {previewMode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                {previewMode ? 'Edit' : 'Preview'}
              </Button>
              <Button variant="outline" size="sm" onClick={handleSaveTemplate}>
                <Save className="h-4 w-4 mr-1" />
                Save Template
              </Button>
              <Button variant="outline" size="sm" onClick={handleResetToDefault}>
                <RotateCcw className="h-4 w-4 mr-1" />
                Reset
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="layout">Layout</TabsTrigger>
              <TabsTrigger value="widgets">Widgets</TabsTrigger>
              <TabsTrigger value="styling">Styling</TabsTrigger>
              <TabsTrigger value="templates">Templates</TabsTrigger>
            </TabsList>

            {/* Layout Configuration */}
            <TabsContent value="layout" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Layout Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="dashboard-name">Dashboard Name</Label>
                      <Input
                        id="dashboard-name"
                        value={currentLayout.name}
                        onChange={(e) => handleLayoutSettingsChange('name', e.target.value)}
                      />
                    </div>

                    <div>
                      <Label htmlFor="dashboard-description">Description</Label>
                      <Textarea
                        id="dashboard-description"
                        value={currentLayout.description}
                        onChange={(e) => handleLayoutSettingsChange('description', e.target.value)}
                      />
                    </div>

                    <div>
                      <Label htmlFor="columns">Columns: {currentLayout.columns}</Label>
                      <Slider
                        id="columns"
                        min={1}
                        max={6}
                        step={1}
                        value={[currentLayout.columns]}
                        onValueChange={([value]) => handleLayoutSettingsChange('columns', value)}
                        className="mt-2"
                      />
                    </div>

                    <div>
                      <Label htmlFor="spacing">Spacing: {currentLayout.spacing}px</Label>
                      <Slider
                        id="spacing"
                        min={8}
                        max={48}
                        step={4}
                        value={[currentLayout.spacing]}
                        onValueChange={([value]) => handleLayoutSettingsChange('spacing', value)}
                        className="mt-2"
                      />
                    </div>

                    <div>
                      <Label htmlFor="theme">Theme</Label>
                      <Select
                        value={currentLayout.theme}
                        onValueChange={(value) => handleLayoutSettingsChange('theme', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="light">Light</SelectItem>
                          <SelectItem value="dark">Dark</SelectItem>
                          <SelectItem value="auto">Auto</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Widget Order</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <DragDropContext onDragEnd={handleDragEnd}>
                      <Droppable droppableId="widgets">
                        {(provided) => (
                          <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                            {currentLayout.widgets.map((widget, index) => (
                              <Draggable key={widget.id} draggableId={widget.id} index={index}>
                                {(provided) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    className="flex items-center justify-between p-3 border rounded-lg bg-muted/50"
                                  >
                                    <div className="flex items-center gap-2">
                                      <Grid3x3 className="h-4 w-4 text-muted-foreground" />
                                      <widget.icon className="h-4 w-4" />
                                      <span className="text-sm font-medium">{widget.title}</span>
                                    </div>
                                    <Badge variant="outline" className="text-xs">
                                      {widget.size}
                                    </Badge>
                                  </div>
                                )}
                              </Draggable>
                            ))}
                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>
                    </DragDropContext>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Widget Configuration */}
            <TabsContent value="widgets" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Available Widgets</CardTitle>
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <div className="relative">
                          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="Search widgets..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-8"
                          />
                        </div>
                      </div>
                      <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Categories</SelectItem>
                          <SelectItem value="analytics">Analytics</SelectItem>
                          <SelectItem value="performance">Performance</SelectItem>
                          <SelectItem value="engagement">Engagement</SelectItem>
                          <SelectItem value="operational">Operational</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardHeader>
                  <CardContent className="max-h-96 overflow-y-auto">
                    <div className="space-y-3">
                      {filteredWidgets.map(widget => (
                        <div key={widget.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <widget.icon className="h-5 w-5" />
                            <div>
                              <div className="font-medium text-sm">{widget.title}</div>
                              <div className="text-xs text-muted-foreground">{widget.description}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {widget.category}
                            </Badge>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleAddWidget(widget)}
                              disabled={currentLayout.widgets.some(w => w.type === widget.type)}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Current Widgets</CardTitle>
                  </CardHeader>
                  <CardContent className="max-h-96 overflow-y-auto">
                    {currentLayout.widgets.length === 0 ? (
                      <Alert>
                        <AlertDescription>
                          No widgets added yet. Add widgets from the available widgets panel.
                        </AlertDescription>
                      </Alert>
                    ) : (
                      currentLayout.widgets.map(renderWidgetConfig)
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Styling Configuration */}
            <TabsContent value="styling" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Custom Colors</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {Object.entries(customColors).map(([key, value]) => (
                      <div key={key}>
                        <Label htmlFor={`color-${key}`} className="capitalize">
                          {key} Color
                        </Label>
                        <div className="flex items-center gap-2 mt-1">
                          <Input
                            id={`color-${key}`}
                            type="color"
                            value={value}
                            onChange={(e) => {
                              const newColors = { ...customColors, [key]: e.target.value }
                              setCustomColors(newColors)
                              handleLayoutSettingsChange('customColors', newColors)
                            }}
                            className="w-16 h-10 p-1 border rounded"
                          />
                          <Input
                            value={value}
                            onChange={(e) => {
                              const newColors = { ...customColors, [key]: e.target.value }
                              setCustomColors(newColors)
                              handleLayoutSettingsChange('customColors', newColors)
                            }}
                            placeholder="#000000"
                            className="flex-1"
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 p-4 border rounded-lg" style={{
                    backgroundColor: customColors.background,
                    color: customColors.text,
                    borderColor: customColors.secondary,
                  }}>
                    <h3 className="font-semibold mb-2" style={{ color: customColors.primary }}>
                      Color Preview
                    </h3>
                    <p className="text-sm mb-2">
                      This is how your dashboard will look with the current color scheme.
                    </p>
                    <div className="flex gap-2">
                      <div
                        className="w-8 h-8 rounded"
                        style={{ backgroundColor: customColors.primary }}
                        title="Primary"
                      />
                      <div
                        className="w-8 h-8 rounded"
                        style={{ backgroundColor: customColors.secondary }}
                        title="Secondary"
                      />
                      <div
                        className="w-8 h-8 rounded"
                        style={{ backgroundColor: customColors.accent }}
                        title="Accent"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Templates */}
            <TabsContent value="templates" className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Dashboard Templates</h3>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleExportConfig}>
                    <Download className="h-4 w-4 mr-1" />
                    Export Config
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <label htmlFor="import-config" className="cursor-pointer">
                      <Upload className="h-4 w-4 mr-1" />
                      Import Config
                      <input
                        id="import-config"
                        type="file"
                        accept=".json"
                        onChange={handleImportConfig}
                        className="hidden"
                      />
                    </label>
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {availableTemplates.map(template => (
                  <Card key={template.id} className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span>{template.name}</span>
                        <Badge variant={template.id === currentLayout.id ? 'default' : 'outline'}>
                          {template.id === currentLayout.id ? 'Active' : 'Available'}
                        </Badge>
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">{template.description}</p>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Widgets:</span>
                          <span>{template.widgets.length}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Columns:</span>
                          <span>{template.columns}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Theme:</span>
                          <span className="capitalize">{template.theme}</span>
                        </div>
                      </div>
                      <Button
                        className="w-full mt-4"
                        variant={template.id === currentLayout.id ? 'outline' : 'default'}
                        onClick={() => handleLoadTemplate(template.id)}
                        disabled={template.id === currentLayout.id}
                      >
                        {template.id === currentLayout.id ? 'Currently Active' : 'Load Template'}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Preview Mode */}
      {previewMode && (
        <Card>
          <CardHeader>
            <CardTitle>Dashboard Preview</CardTitle>
            <p className="text-sm text-muted-foreground">
              Preview of your customized dashboard layout
            </p>
          </CardHeader>
          <CardContent>
            <div
              className="grid gap-4 p-4 border rounded-lg min-h-[400px]"
              style={{
                gridTemplateColumns: `repeat(${currentLayout.columns}, 1fr)`,
                gap: `${currentLayout.spacing}px`,
                backgroundColor: customColors.background,
              }}
            >
              {currentLayout.widgets.map((widget, index) => (
                <div
                  key={`preview-${widget.id}-${index}`}
                  className="border rounded-lg p-4 flex items-center justify-center"
                  style={{
                    borderColor: customColors.secondary,
                    backgroundColor: 'rgba(255, 255, 255, 0.5)',
                    minHeight: `${widget.minHeight}px`,
                    gridColumn: widget.size === 'extra-large' ? `span ${Math.min(currentLayout.columns, 2)}` :
                               widget.size === 'large' ? `span ${Math.min(currentLayout.columns, 2)}` : 'span 1',
                  }}
                >
                  <div className="text-center">
                    <widget.icon className="h-8 w-8 mx-auto mb-2" style={{ color: customColors.primary }} />
                    <div className="font-medium" style={{ color: customColors.text }}>
                      {widget.title}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {widget.size} widget
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default DashboardCustomizer
