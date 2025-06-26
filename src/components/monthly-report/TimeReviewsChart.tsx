
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { List, BarChart2, Calendar } from 'lucide-react'

interface TimeReviewsChartProps {
  timeReviewsData: {
    date: string;
    day: string;
    count: number;
  }[];
  viewMode: 'daily' | 'weekly' | 'monthly';
  setViewMode: (mode: 'day' | 'week' | 'month') => void;
}

export function TimeReviewsChart({ timeReviewsData, viewMode, setViewMode }: TimeReviewsChartProps) {
  // Map the internal viewMode to the props viewMode
  const handleViewModeChange = (value: string) => {
    if (!value) return

    if (value === 'daily') setViewMode('day')
    else if (value === 'weekly') setViewMode('week')
    else if (value === 'monthly') setViewMode('month')
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>Review Summary</CardTitle>
            <CardDescription>
              Review count by {viewMode === 'daily' ? 'day' : viewMode === 'weekly' ? 'week' : 'month'} for selected date range
            </CardDescription>
          </div>
          <div className="flex flex-col md:flex-row gap-2 mt-2 md:mt-0">
            <ToggleGroup
              type="single"
              value={viewMode}
              onValueChange={handleViewModeChange}
            >
              <ToggleGroupItem value="daily" aria-label="Daily view">
                <List className="h-4 w-4 mr-1" />
                Daily
              </ToggleGroupItem>
              <ToggleGroupItem value="weekly" aria-label="Weekly view">
                <BarChart2 className="h-4 w-4 mr-1" />
                Weekly
              </ToggleGroupItem>
              <ToggleGroupItem value="monthly" aria-label="Monthly view">
                <Calendar className="h-4 w-4 mr-1" />
                Monthly
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={timeReviewsData}
              margin={{ top: 20, right: 30, left: 20, bottom: 50 }}
            >
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis
                dataKey={(data) => `${data.date} ${viewMode !== 'monthly' ? `(${data.day.substring(0, 3)})` : ''}`}
                angle={-45}
                textAnchor="end"
                height={70}
                tick={{ fontSize: 12 }}
              />
              <YAxis />
              <Tooltip
                formatter={(value, name, props) => {
                  return [`${value} reviews`, 'Reviews']
                }}
                labelFormatter={(label) => {
                  // Check if the label contains the day part
                  if (typeof label === 'string' && label.includes('(')) {
                    // Extract just the date part before the day
                    return label
                  }
                  return label
                }}
                contentStyle={{ borderRadius: '6px' }}
              />
              <Bar
                dataKey="count"
                fill="#6366F1"
                name="Reviews"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
