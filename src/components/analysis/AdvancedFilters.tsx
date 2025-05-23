import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  Filter, 
  Search, 
  Calendar, 
  Star, 
  MessageSquare, 
  User, 
  Hash, 
  ChevronDown,
  ChevronUp,
  X,
  RefreshCw,
  Save,
  Download,
  Upload
} from 'lucide-react';
import { Review } from '@/types/reviews';

export interface FilterCriteria {
  // Date filters
  dateRange: {
    startDate: string;
    endDate: string;
    enabled: boolean;
  };
  
  // Rating filters
  ratingRange: {
    min: number;
    max: number;
    enabled: boolean;
  };
  
  // Sentiment filters
  sentiment: {
    positive: boolean;
    neutral: boolean;
    negative: boolean;
    mixed: boolean;
    enabled: boolean;
  };
  
  // Text search
  textSearch: {
    query: string;
    fields: ('text' | 'responseFromOwnerText' | 'staffMentioned' | 'mainThemes')[];
    caseSensitive: boolean;
    wholeWords: boolean;
    enabled: boolean;
  };
  
  // Staff filters
  staffFilter: {
    mentionedStaff: string[];
    hasStaffMention: boolean | null; // null = all, true = only with mentions, false = only without
    enabled: boolean;
  };
  
  // Response filters
  responseFilter: {
    hasResponse: boolean | null; // null = all, true = only with response, false = only without
    responseLength: {
      min: number;
      max: number;
      enabled: boolean;
    };
    enabled: boolean;
  };
  
  // Theme filters
  themeFilter: {
    themes: string[];
    themeMode: 'include' | 'exclude'; // include = must have these themes, exclude = must not have these themes
    enabled: boolean;
  };
  
  // Advanced filters
  advanced: {
    reviewLength: {
      min: number;
      max: number;
      enabled: boolean;
    };
    language: {
      languages: string[];
      enabled: boolean;
    };
    enabled: boolean;
  };
}

export interface AdvancedFiltersProps {
  reviews: Review[];
  onFiltersChange: (filteredReviews: Review[], criteria: FilterCriteria) => void;
  initialFilters?: Partial<FilterCriteria>;
  showResultCount?: boolean;
  enablePresets?: boolean;
}

const DEFAULT_FILTERS: FilterCriteria = {
  dateRange: {
    startDate: '',
    endDate: '',
    enabled: false,
  },
  ratingRange: {
    min: 1,
    max: 5,
    enabled: false,
  },
  sentiment: {
    positive: true,
    neutral: true,
    negative: true,
    mixed: true,
    enabled: false,
  },
  textSearch: {
    query: '',
    fields: ['text'],
    caseSensitive: false,
    wholeWords: false,
    enabled: false,
  },
  staffFilter: {
    mentionedStaff: [],
    hasStaffMention: null,
    enabled: false,
  },
  responseFilter: {
    hasResponse: null,
    responseLength: {
      min: 0,
      max: 1000,
      enabled: false,
    },
    enabled: false,
  },
  themeFilter: {
    themes: [],
    themeMode: 'include',
    enabled: false,
  },
  advanced: {
    reviewLength: {
      min: 0,
      max: 1000,
      enabled: false,
    },
    language: {
      languages: [],
      enabled: false,
    },
    enabled: false,
  },
};

export const AdvancedFilters: React.FC<AdvancedFiltersProps> = ({
  reviews,
  onFiltersChange,
  initialFilters = {},
  showResultCount = true,
  enablePresets = true
}) => {
  const [filters, setFilters] = useState<FilterCriteria>({
    ...DEFAULT_FILTERS,
    ...initialFilters
  });
  const [isExpanded, setIsExpanded] = useState(false);
  const [savedPresets, setSavedPresets] = useState<Array<{name: string; filters: FilterCriteria}>>([]);

  // Extract unique values from reviews for filter options
  const filterOptions = useMemo(() => {
    const staff = new Set<string>();
    const themes = new Set<string>();
    const languages = new Set<string>();

    reviews.forEach(review => {
      // Extract staff mentions
      if (review.staffMentioned) {
        const staffNames = review.staffMentioned.split(/[,;|&]/).map(name => name.trim()).filter(name => name.length > 0);
        staffNames.forEach(name => staff.add(name));
      }

      // Extract themes
      if (review.mainThemes) {
        const reviewThemes = review.mainThemes.split(/[,;|]/).map(theme => theme.trim()).filter(theme => theme.length > 0);
        reviewThemes.forEach(theme => themes.add(theme));
      }

      // Detect language (simplified - you might want to use a proper language detection library)
      if (review.text) {
        // This is a very basic language detection - in practice, you'd use a proper library
        const hasNonLatin = /[^\u0000-\u007F]/.test(review.text);
        if (hasNonLatin) {
          languages.add('Non-Latin');
        } else {
          languages.add('English');
        }
      }
    });

    return {
      staff: Array.from(staff).sort(),
      themes: Array.from(themes).sort(),
      languages: Array.from(languages).sort(),
    };
  }, [reviews]);

  // Apply filters and get filtered results
  const filteredReviews = useMemo(() => {
    let filtered = [...reviews];

    // Date range filter
    if (filters.dateRange.enabled && (filters.dateRange.startDate || filters.dateRange.endDate)) {
      filtered = filtered.filter(review => {
        if (!review.publishedAtDate) return false;
        const reviewDate = new Date(review.publishedAtDate);
        
        if (filters.dateRange.startDate) {
          const startDate = new Date(filters.dateRange.startDate);
          if (reviewDate < startDate) return false;
        }
        
        if (filters.dateRange.endDate) {
          const endDate = new Date(filters.dateRange.endDate);
          if (reviewDate > endDate) return false;
        }
        
        return true;
      });
    }

    // Rating range filter
    if (filters.ratingRange.enabled) {
      filtered = filtered.filter(review => {
        if (!review.stars) return false;
        return review.stars >= filters.ratingRange.min && review.stars <= filters.ratingRange.max;
      });
    }

    // Sentiment filter
    if (filters.sentiment.enabled) {
      filtered = filtered.filter(review => {
        const sentiment = review.sentiment?.toLowerCase() || 'neutral';
        
        if (sentiment.includes('positive') && filters.sentiment.positive) return true;
        if (sentiment.includes('negative') && filters.sentiment.negative) return true;
        if (sentiment.includes('mixed') && filters.sentiment.mixed) return true;
        if (!sentiment.includes('positive') && !sentiment.includes('negative') && !sentiment.includes('mixed') && filters.sentiment.neutral) return true;
        
        return false;
      });
    }

    // Text search filter
    if (filters.textSearch.enabled && filters.textSearch.query) {
      const query = filters.textSearch.caseSensitive ? filters.textSearch.query : filters.textSearch.query.toLowerCase();
      const regex = filters.textSearch.wholeWords 
        ? new RegExp(`\\b${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, filters.textSearch.caseSensitive ? 'g' : 'gi')
        : new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), filters.textSearch.caseSensitive ? 'g' : 'gi');

      filtered = filtered.filter(review => {
        return filters.textSearch.fields.some(field => {
          const fieldValue = review[field];
          if (!fieldValue) return false;
          
          const searchText = filters.textSearch.caseSensitive ? fieldValue : fieldValue.toLowerCase();
          return regex.test(searchText);
        });
      });
    }

    // Staff filter
    if (filters.staffFilter.enabled) {
      if (filters.staffFilter.hasStaffMention !== null) {
        filtered = filtered.filter(review => {
          const hasStaff = !!(review.staffMentioned && review.staffMentioned.trim());
          return hasStaff === filters.staffFilter.hasStaffMention;
        });
      }

      if (filters.staffFilter.mentionedStaff.length > 0) {
        filtered = filtered.filter(review => {
          if (!review.staffMentioned) return false;
          const staffMentions = review.staffMentioned.toLowerCase();
          return filters.staffFilter.mentionedStaff.some(staff => 
            staffMentions.includes(staff.toLowerCase())
          );
        });
      }
    }

    // Response filter
    if (filters.responseFilter.enabled) {
      if (filters.responseFilter.hasResponse !== null) {
        filtered = filtered.filter(review => {
          const hasResponse = !!(review.responseFromOwnerText && review.responseFromOwnerText.trim());
          return hasResponse === filters.responseFilter.hasResponse;
        });
      }

      if (filters.responseFilter.responseLength.enabled) {
        filtered = filtered.filter(review => {
          if (!review.responseFromOwnerText) return false;
          const length = review.responseFromOwnerText.length;
          return length >= filters.responseFilter.responseLength.min && 
                 length <= filters.responseFilter.responseLength.max;
        });
      }
    }

    // Theme filter
    if (filters.themeFilter.enabled && filters.themeFilter.themes.length > 0) {
      filtered = filtered.filter(review => {
        if (!review.mainThemes) return filters.themeFilter.themeMode === 'exclude';
        
        const reviewThemes = review.mainThemes.toLowerCase();
        const hasAnyTheme = filters.themeFilter.themes.some(theme => 
          reviewThemes.includes(theme.toLowerCase())
        );
        
        return filters.themeFilter.themeMode === 'include' ? hasAnyTheme : !hasAnyTheme;
      });
    }

    // Advanced filters
    if (filters.advanced.enabled) {
      // Review length filter
      if (filters.advanced.reviewLength.enabled) {
        filtered = filtered.filter(review => {
          if (!review.text) return false;
          const length = review.text.length;
          return length >= filters.advanced.reviewLength.min && 
                 length <= filters.advanced.reviewLength.max;
        });
      }

      // Language filter
      if (filters.advanced.language.enabled && filters.advanced.language.languages.length > 0) {
        filtered = filtered.filter(review => {
          if (!review.text) return false;
          const hasNonLatin = /[^\u0000-\u007F]/.test(review.text);
          const detectedLanguage = hasNonLatin ? 'Non-Latin' : 'English';
          return filters.advanced.language.languages.includes(detectedLanguage);
        });
      }
    }

    return filtered;
  }, [reviews, filters]);

  // Update parent component when filters change
  useEffect(() => {
    onFiltersChange(filteredReviews, filters);
  }, [filteredReviews, filters, onFiltersChange]);

  const updateFilter = (path: string, value: any) => {
    setFilters(prev => {
      const newFilters = { ...prev };
      const keys = path.split('.');
      let current: any = newFilters;
      
      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]];
      }
      
      current[keys[keys.length - 1]] = value;
      return newFilters;
    });
  };

  const resetFilters = () => {
    setFilters(DEFAULT_FILTERS);
  };

  const savePreset = () => {
    const name = prompt('Enter preset name:');
    if (name) {
      setSavedPresets(prev => [...prev, { name, filters }]);
    }
  };

  const loadPreset = (preset: {name: string; filters: FilterCriteria}) => {
    setFilters(preset.filters);
  };

  const exportFilters = () => {
    const dataStr = JSON.stringify(filters, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = 'review-filters.json';
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const importFilters = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const imported = JSON.parse(e.target?.result as string);
          setFilters(imported);
        } catch (error) {
          alert('Invalid filter file format');
        }
      };
      reader.readAsText(file);
    }
  };

  const activeFilterCount = Object.values(filters).filter(filter => 
    typeof filter === 'object' && filter !== null && 'enabled' in filter && filter.enabled
  ).length;

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-blue-500" />
            <CardTitle>Advanced Filters</CardTitle>
            {activeFilterCount > 0 && (
              <Badge variant="secondary">{activeFilterCount} active</Badge>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {showResultCount && (
              <Badge variant="outline">
                {filteredReviews.length} / {reviews.length} reviews
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleContent>
          <CardContent>
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="basic">Basic</TabsTrigger>
                <TabsTrigger value="content">Content</TabsTrigger>
                <TabsTrigger value="interaction">Interaction</TabsTrigger>
                <TabsTrigger value="advanced">Advanced</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-6 mt-6">
                {/* Date Range Filter */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Switch 
                      checked={filters.dateRange.enabled}
                      onCheckedChange={(enabled) => updateFilter('dateRange.enabled', enabled)}
                    />
                    <Label className="font-medium">Date Range</Label>
                  </div>
                  {filters.dateRange.enabled && (
                    <div className="grid grid-cols-2 gap-4 ml-6">
                      <div>
                        <Label>Start Date</Label>
                        <Input
                          type="date"
                          value={filters.dateRange.startDate}
                          onChange={(e) => updateFilter('dateRange.startDate', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label>End Date</Label>
                        <Input
                          type="date"
                          value={filters.dateRange.endDate}
                          onChange={(e) => updateFilter('dateRange.endDate', e.target.value)}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Rating Range Filter */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Switch 
                      checked={filters.ratingRange.enabled}
                      onCheckedChange={(enabled) => updateFilter('ratingRange.enabled', enabled)}
                    />
                    <Label className="font-medium">Rating Range</Label>
                  </div>
                  {filters.ratingRange.enabled && (
                    <div className="ml-6 space-y-3">
                      <div className="flex items-center space-x-4">
                        <Star className="w-4 h-4" />
                        <span className="text-sm">{filters.ratingRange.min}</span>
                        <Slider
                          value={[filters.ratingRange.min, filters.ratingRange.max]}
                          onValueChange={([min, max]) => {
                            updateFilter('ratingRange.min', min);
                            updateFilter('ratingRange.max', max);
                          }}
                          min={1}
                          max={5}
                          step={1}
                          className="flex-1"
                        />
                        <span className="text-sm">{filters.ratingRange.max}</span>
                        <Star className="w-4 h-4" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Sentiment Filter */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Switch 
                      checked={filters.sentiment.enabled}
                      onCheckedChange={(enabled) => updateFilter('sentiment.enabled', enabled)}
                    />
                    <Label className="font-medium">Sentiment</Label>
                  </div>
                  {filters.sentiment.enabled && (
                    <div className="ml-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          checked={filters.sentiment.positive}
                          onCheckedChange={(checked) => updateFilter('sentiment.positive', checked)}
                        />
                        <Label>Positive</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          checked={filters.sentiment.neutral}
                          onCheckedChange={(checked) => updateFilter('sentiment.neutral', checked)}
                        />
                        <Label>Neutral</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          checked={filters.sentiment.negative}
                          onCheckedChange={(checked) => updateFilter('sentiment.negative', checked)}
                        />
                        <Label>Negative</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          checked={filters.sentiment.mixed}
                          onCheckedChange={(checked) => updateFilter('sentiment.mixed', checked)}
                        />
                        <Label>Mixed</Label>
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="content" className="space-y-6 mt-6">
                {/* Text Search Filter */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Switch 
                      checked={filters.textSearch.enabled}
                      onCheckedChange={(enabled) => updateFilter('textSearch.enabled', enabled)}
                    />
                    <Label className="font-medium">Text Search</Label>
                  </div>
                  {filters.textSearch.enabled && (
                    <div className="ml-6 space-y-4">
                      <div className="flex items-center space-x-2">
                        <Search className="w-4 h-4" />
                        <Input
                          placeholder="Search in reviews..."
                          value={filters.textSearch.query}
                          onChange={(e) => updateFilter('textSearch.query', e.target.value)}
                          className="flex-1"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            checked={filters.textSearch.caseSensitive}
                            onCheckedChange={(checked) => updateFilter('textSearch.caseSensitive', checked)}
                          />
                          <Label>Case sensitive</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            checked={filters.textSearch.wholeWords}
                            onCheckedChange={(checked) => updateFilter('textSearch.wholeWords', checked)}
                          />
                          <Label>Whole words only</Label>
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Search in:</Label>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          {[
                            { key: 'text', label: 'Review Text' },
                            { key: 'responseFromOwnerText', label: 'Owner Response' },
                            { key: 'staffMentioned', label: 'Staff Mentions' },
                            { key: 'mainThemes', label: 'Themes' },
                          ].map(field => (
                            <div key={field.key} className="flex items-center space-x-2">
                              <Checkbox
                                checked={filters.textSearch.fields.includes(field.key as any)}
                                onCheckedChange={(checked) => {
                                  const newFields = checked 
                                    ? [...filters.textSearch.fields, field.key as any]
                                    : filters.textSearch.fields.filter(f => f !== field.key);
                                  updateFilter('textSearch.fields', newFields);
                                }}
                              />
                              <Label className="text-sm">{field.label}</Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Theme Filter */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Switch 
                      checked={filters.themeFilter.enabled}
                      onCheckedChange={(enabled) => updateFilter('themeFilter.enabled', enabled)}
                    />
                    <Label className="font-medium">Themes</Label>
                  </div>
                  {filters.themeFilter.enabled && (
                    <div className="ml-6 space-y-4">
                      <div className="flex items-center space-x-4">
                        <Label>Mode:</Label>
                        <Select 
                          value={filters.themeFilter.themeMode} 
                          onValueChange={(value: 'include' | 'exclude') => updateFilter('themeFilter.themeMode', value)}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="include">Include</SelectItem>
                            <SelectItem value="exclude">Exclude</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Select themes:</Label>
                        <div className="mt-2 max-h-40 overflow-y-auto border rounded p-3">
                          {filterOptions.themes.map(theme => (
                            <div key={theme} className="flex items-center space-x-2 mb-2">
                              <Checkbox
                                checked={filters.themeFilter.themes.includes(theme)}
                                onCheckedChange={(checked) => {
                                  const newThemes = checked 
                                    ? [...filters.themeFilter.themes, theme]
                                    : filters.themeFilter.themes.filter(t => t !== theme);
                                  updateFilter('themeFilter.themes', newThemes);
                                }}
                              />
                              <Label className="text-sm">{theme}</Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="interaction" className="space-y-6 mt-6">
                {/* Staff Filter */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Switch 
                      checked={filters.staffFilter.enabled}
                      onCheckedChange={(enabled) => updateFilter('staffFilter.enabled', enabled)}
                    />
                    <Label className="font-medium">Staff Mentions</Label>
                  </div>
                  {filters.staffFilter.enabled && (
                    <div className="ml-6 space-y-4">
                      <div>
                        <Label className="text-sm font-medium">Staff mention requirement:</Label>
                        <Select 
                          value={filters.staffFilter.hasStaffMention === null ? 'all' : filters.staffFilter.hasStaffMention.toString()} 
                          onValueChange={(value) => {
                            const val = value === 'all' ? null : value === 'true';
                            updateFilter('staffFilter.hasStaffMention', val);
                          }}
                        >
                          <SelectTrigger className="w-48 mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All reviews</SelectItem>
                            <SelectItem value="true">Only with staff mentions</SelectItem>
                            <SelectItem value="false">Only without staff mentions</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {filterOptions.staff.length > 0 && (
                        <div>
                          <Label className="text-sm font-medium">Specific staff members:</Label>
                          <div className="mt-2 max-h-40 overflow-y-auto border rounded p-3">
                            {filterOptions.staff.map(staff => (
                              <div key={staff} className="flex items-center space-x-2 mb-2">
                                <Checkbox
                                  checked={filters.staffFilter.mentionedStaff.includes(staff)}
                                  onCheckedChange={(checked) => {
                                    const newStaff = checked 
                                      ? [...filters.staffFilter.mentionedStaff, staff]
                                      : filters.staffFilter.mentionedStaff.filter(s => s !== staff);
                                    updateFilter('staffFilter.mentionedStaff', newStaff);
                                  }}
                                />
                                <Label className="text-sm">{staff}</Label>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Response Filter */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Switch 
                      checked={filters.responseFilter.enabled}
                      onCheckedChange={(enabled) => updateFilter('responseFilter.enabled', enabled)}
                    />
                    <Label className="font-medium">Owner Responses</Label>
                  </div>
                  {filters.responseFilter.enabled && (
                    <div className="ml-6 space-y-4">
                      <div>
                        <Label className="text-sm font-medium">Response requirement:</Label>
                        <Select 
                          value={filters.responseFilter.hasResponse === null ? 'all' : filters.responseFilter.hasResponse.toString()} 
                          onValueChange={(value) => {
                            const val = value === 'all' ? null : value === 'true';
                            updateFilter('responseFilter.hasResponse', val);
                          }}
                        >
                          <SelectTrigger className="w-48 mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All reviews</SelectItem>
                            <SelectItem value="true">Only with responses</SelectItem>
                            <SelectItem value="false">Only without responses</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                          <Switch 
                            checked={filters.responseFilter.responseLength.enabled}
                            onCheckedChange={(enabled) => updateFilter('responseFilter.responseLength.enabled', enabled)}
                          />
                          <Label className="text-sm font-medium">Response length</Label>
                        </div>
                        {filters.responseFilter.responseLength.enabled && (
                          <div className="ml-6">
                            <div className="flex items-center space-x-4">
                              <span className="text-sm">{filters.responseFilter.responseLength.min}</span>
                              <Slider
                                value={[filters.responseFilter.responseLength.min, filters.responseFilter.responseLength.max]}
                                onValueChange={([min, max]) => {
                                  updateFilter('responseFilter.responseLength.min', min);
                                  updateFilter('responseFilter.responseLength.max', max);
                                }}
                                min={0}
                                max={1000}
                                step={10}
                                className="flex-1"
                              />
                              <span className="text-sm">{filters.responseFilter.responseLength.max}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="advanced" className="space-y-6 mt-6">
                {/* Advanced Filters */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Switch 
                      checked={filters.advanced.enabled}
                      onCheckedChange={(enabled) => updateFilter('advanced.enabled', enabled)}
                    />
                    <Label className="font-medium">Advanced Options</Label>
                  </div>
                  {filters.advanced.enabled && (
                    <div className="ml-6 space-y-6">
                      {/* Review Length Filter */}
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                          <Switch 
                            checked={filters.advanced.reviewLength.enabled}
                            onCheckedChange={(enabled) => updateFilter('advanced.reviewLength.enabled', enabled)}
                          />
                          <Label className="text-sm font-medium">Review length (characters)</Label>
                        </div>
                        {filters.advanced.reviewLength.enabled && (
                          <div className="ml-6">
                            <div className="flex items-center space-x-4">
                              <span className="text-sm">{filters.advanced.reviewLength.min}</span>
                              <Slider
                                value={[filters.advanced.reviewLength.min, filters.advanced.reviewLength.max]}
                                onValueChange={([min, max]) => {
                                  updateFilter('advanced.reviewLength.min', min);
                                  updateFilter('advanced.reviewLength.max', max);
                                }}
                                min={0}
                                max={1000}
                                step={10}
                                className="flex-1"
                              />
                              <span className="text-sm">{filters.advanced.reviewLength.max}</span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Language Filter */}
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                          <Switch 
                            checked={filters.advanced.language.enabled}
                            onCheckedChange={(enabled) => updateFilter('advanced.language.enabled', enabled)}
                          />
                          <Label className="text-sm font-medium">Language</Label>
                        </div>
                        {filters.advanced.language.enabled && (
                          <div className="ml-6">
                            <div className="grid grid-cols-2 gap-2">
                              {filterOptions.languages.map(language => (
                                <div key={language} className="flex items-center space-x-2">
                                  <Checkbox
                                    checked={filters.advanced.language.languages.includes(language)}
                                    onCheckedChange={(checked) => {
                                      const newLanguages = checked 
                                        ? [...filters.advanced.language.languages, language]
                                        : filters.advanced.language.languages.filter(l => l !== language);
                                      updateFilter('advanced.language.languages', newLanguages);
                                    }}
                                  />
                                  <Label className="text-sm">{language}</Label>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>

            {/* Action Buttons */}
            <div className="flex items-center justify-between mt-6 pt-6 border-t">
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" onClick={resetFilters}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Reset All
                </Button>
                {enablePresets && (
                  <>
                    <Button variant="outline" size="sm" onClick={savePreset}>
                      <Save className="w-4 h-4 mr-2" />
                      Save Preset
                    </Button>
                    {savedPresets.length > 0 && (
                      <Select onValueChange={(value) => {
                        const preset = savedPresets.find(p => p.name === value);
                        if (preset) loadPreset(preset);
                      }}>
                        <SelectTrigger className="w-40">
                          <SelectValue placeholder="Load Preset" />
                        </SelectTrigger>
                        <SelectContent>
                          {savedPresets.map(preset => (
                            <SelectItem key={preset.name} value={preset.name}>
                              {preset.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" onClick={exportFilters}>
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
                <Button variant="outline" size="sm" onClick={() => document.getElementById('import-input')?.click()}>
                  <Upload className="w-4 h-4 mr-2" />
                  Import
                </Button>
                <input
                  id="import-input"
                  type="file"
                  accept=".json"
                  style={{ display: 'none' }}
                  onChange={importFilters}
                />
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};

export default AdvancedFilters;
