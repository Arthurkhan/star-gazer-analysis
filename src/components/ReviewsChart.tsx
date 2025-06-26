import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { MonthlyReviewData } from '@/types/reviews'
import { useMemo, useEffect, useState } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

interface ReviewsChartProps {
  data: MonthlyReviewData[];
}

const ReviewsChart = ({ data }: ReviewsChartProps) => {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)

    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Use the chart data directly
  const chartData = useMemo(() => {
    if (!data?.length) return []
    return data
  }, [data])

  if (!chartData.length) {
    return (
      <Card className="shadow-md border-0 dark:bg-gray-800">
        <CardHeader>
          <CardTitle>Reviews Over Time</CardTitle>
          <CardDescription>Monthly review count</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] sm:h-[450px] flex items-center justify-center text-muted-foreground">
            No data to display
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="shadow-md border-0 dark:bg-gray-800">
      <CardHeader className="pb-4">
        <div>
          <CardTitle className="text-lg sm:text-xl">Reviews Over Time</CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Monthly review count
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="px-2 sm:px-6">
        <div className="h-[400px] sm:h-[450px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{
                top: 20,
                right: 10,
                left: 10,
                bottom: 50,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis
                dataKey="month"
                angle={-60}
                textAnchor="end"
                height={70}
                tick={{ fontSize: 11 }}
                tickLine={{ stroke: '#ccc' }}
                axisLine={{ stroke: '#ccc' }}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 12 }}
                tickLine={{ stroke: '#ccc' }}
                axisLine={{ stroke: '#ccc' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(0, 0, 0, 0.8)',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                }}
                labelStyle={{ color: '#fff' }}
              />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ r: 4, strokeWidth: 1, fill: '#fff' }}
                activeDot={{ r: 6, strokeWidth: 0, fill: '#3b82f6' }}
                name="Reviews"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

export default ReviewsChart
