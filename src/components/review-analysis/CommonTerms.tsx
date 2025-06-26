
import React, { useState } from 'react'
import type { Review } from '@/types/reviews'
import { extractCommonTerms_sync } from '@/utils/dataUtils'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Treemap, ResponsiveContainer, Tooltip, Cell } from 'recharts'
import { CustomTermsTooltip } from './CustomTooltips'

interface CommonTermsProps {
  reviews: Review[];
  loading: boolean;
}

// Category-specific colors for consistent visualization
const CATEGORY_COLORS: Record<string, string> = {
  'Service': '#10B981', // Green
  'Ambiance': '#8B5CF6', // Purple
  'Food & Drinks': '#F97316', // Orange
  'Value & Price': '#0EA5E9', // Blue
  'Cleanliness': '#06B6D4', // Cyan
  'Location': '#F59E0B', // Amber
  'Art & Gallery': '#EC4899', // Pink
  'Little Prince Theme': '#6366F1', // Indigo
  'Overall Experience': '#0284C7', // Sky
  'Staff': '#4F46E5', // Indigo
  'Others': '#6B7280', // Gray
}

// Enhanced colors for treemap visualization
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
  '#F2FCE2',  // Soft Green
]

const CommonTerms: React.FC<CommonTermsProps> = ({ reviews, loading }) => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const commonTerms = extractCommonTerms_sync(reviews)

  // Group common terms by category
  const getGroupedTerms = () => {
    // Extract unique categories
    const categories = Array.from(new Set(commonTerms.map(term => term.category || 'Others')))

    // Create category buckets
    const groupedByCategory: Record<string, {text: string, count: number, category?: string}[]> = {}

    categories.forEach(category => {
      groupedByCategory[category] = commonTerms.filter(term => (term.category || 'Others') === category)
    })

    return { categories, groupedByCategory }
  }

  const { categories, groupedByCategory } = getGroupedTerms()

  // Prepare data for treemap visualization
  const prepareTreemapData = () => {
    // Group by category first
    const categoryCounts: Record<string, number> = {}
    const categoryItems: Record<string, any[]> = {}

    commonTerms.forEach(term => {
      const category = term.category || 'Others'

      if (!categoryCounts[category]) {
        categoryCounts[category] = 0
        categoryItems[category] = []
      }

      categoryCounts[category] += term.count

      // Only add top terms per category to avoid overcrowding
      if (categoryItems[category].length < 8) {
        categoryItems[category].push({
          name: term.text,
          value: term.count,
          category,
          color: CATEGORY_COLORS[category] || COLORS[Object.keys(categoryItems).length % COLORS.length],
        })
      }
    })

    // Filter to only show categories with substantial mentions
    const significantCategories = Object.keys(categoryCounts)
      .filter(category => {
        // Show selected category or categories with >5% of total mentions
        const totalMentions = commonTerms.reduce((sum, term) => sum + term.count, 0)
        return selectedCategory === category || categoryCounts[category] / totalMentions > 0.05
      })

    // Flatten the items from significant categories
    const treemapData = significantCategories.flatMap(category => categoryItems[category])

    return treemapData.sort((a, b) => b.value - a.value)
  }

  const treemapData = prepareTreemapData()

  return (
    <div>
      <h3 className="text-lg font-medium mb-4 text-gray-900 dark:text-white">
        Common Terms & Themes {loading && <span className="text-sm font-normal text-gray-500">(AI-enhanced)</span>}
      </h3>

      <Tabs defaultValue="treemap" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="treemap">Visual Map</TabsTrigger>
          <TabsTrigger value="categories">By Category</TabsTrigger>
          <TabsTrigger value="table">Table View</TabsTrigger>
        </TabsList>

        {/* Treemap visualization */}
        <TabsContent value="treemap" className="mt-0">
          <div className="bg-gray-50 dark:bg-gray-900/30 p-4 rounded-lg border mb-2">
            <div className="flex flex-wrap gap-2 mb-4">
              <Button
                variant={selectedCategory === null ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(null)}
              >
                All
              </Button>

              {categories.map(category => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(selectedCategory === category ? null : category)}
                  className="text-xs"
                  style={{
                    borderColor: CATEGORY_COLORS[category] || undefined,
                    color: selectedCategory === category ? undefined : CATEGORY_COLORS[category] || undefined,
                  }}
                >
                  {category}
                </Button>
              ))}
            </div>

            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <Treemap
                  data={treemapData}
                  dataKey="value"
                  aspectRatio={4/3}
                  stroke="#fff"
                  fill="#8884d8"
                  nameKey="name"
                >
                  <Tooltip content={<CustomTermsTooltip />} />
                  {treemapData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.color || COLORS[index % COLORS.length]}
                    />
                  ))}
                </Treemap>
              </ResponsiveContainer>
            </div>
          </div>
        </TabsContent>

        {/* Categories view */}
        <TabsContent value="categories" className="mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {categories.map(category => (
              <div
                key={category}
                className="bg-white dark:bg-gray-800 p-4 rounded-lg border dark:border-gray-700 shadow-sm"
              >
                <h4 className="font-medium text-base mb-3 pb-2 border-b dark:border-gray-700 flex items-center">
                  <div
                    className="w-3 h-3 rounded-full mr-2"
                    style={{ backgroundColor: CATEGORY_COLORS[category] || COLORS[categories.indexOf(category) % COLORS.length] }}
                  />
                  {category}
                </h4>
                <div className="space-y-2">
                  {groupedByCategory[category]
                    .slice(0, 6)
                    .map((term, idx) => (
                      <div key={idx} className="flex justify-between items-center">
                        <span className="text-sm">{term.text}</span>
                        <Badge variant="outline" className="text-xs">
                          {term.count}
                        </Badge>
                      </div>
                    ),
                  )}

                  {groupedByCategory[category].length > 6 && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 text-right mt-2">
                      + {groupedByCategory[category].length - 6} more
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* Table view */}
        <TabsContent value="table" className="mt-0">
          <div className="overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Term</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Occurrences</TableHead>
                  <TableHead>% of Reviews</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {commonTerms.slice(0, 20).map((term, index) => {
                  const percentage = (term.count / reviews.length * 100).toFixed(1)
                  return (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{term.text}</TableCell>
                      <TableCell>
                        {term.category && (
                          <Badge
                            variant="outline"
                            style={{
                              borderColor: CATEGORY_COLORS[term.category] || undefined,
                              color: CATEGORY_COLORS[term.category] || undefined,
                            }}
                          >
                            {term.category}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>{term.count}</TableCell>
                      <TableCell>{percentage}%</TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default CommonTerms
