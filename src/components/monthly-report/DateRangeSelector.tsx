
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Input } from '@/components/ui/input'
import { format } from 'date-fns'
import { CalendarRange } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DateRangeSelectorProps {
  dateRange: {
    from: Date;
    to: Date | undefined;
  };
  selectingDate: 'from' | 'to';
  setSelectingDate: (value: 'from' | 'to') => void;
  fromDateInput: string;
  setFromDateInput: (value: string) => void;
  toDateInput: string;
  setToDateInput: (value: string) => void;
  dateInputError: string;
  dateRangePresets: { name: string; range: () => { from: Date; to: Date | undefined } }[];
  applyDateRangePreset: (presetIndex: number) => void;
  handleDateSelect: (date: Date | undefined) => void;
  handleManualDateSubmit: (e: React.FormEvent) => void;
  isDateInRange: (date: Date) => boolean;
}

export function DateRangeSelector({
  dateRange,
  selectingDate,
  setSelectingDate,
  fromDateInput,
  setFromDateInput,
  toDateInput,
  setToDateInput,
  dateInputError,
  dateRangePresets,
  applyDateRangePreset,
  handleDateSelect,
  handleManualDateSubmit,
  isDateInRange,
}: DateRangeSelectorProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-2">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Reviews Analysis</h2>
        <p className="text-muted-foreground">
          Analysis for period: {format(dateRange.from, 'MMM d, yyyy')} - {dateRange.to ? format(dateRange.to, 'MMM d, yyyy') : 'Select end date'}
        </p>
      </div>
      <div className="flex flex-col md:flex-row gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline">
              <CalendarRange className="mr-2 h-4 w-4" />
              <span>
                {format(dateRange.from, 'MMM d, yyyy')} - {dateRange.to ? format(dateRange.to, 'MMM d, yyyy') : 'Select end date'}
              </span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <div className="p-2 border-b">
              <div className="flex justify-center flex-wrap gap-1 mb-2">
                {dateRangePresets.map((preset, index) => (
                  <Button
                    key={preset.name}
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => applyDateRangePreset(index)}
                  >
                    {preset.name}
                  </Button>
                ))}
              </div>
              <p className="text-xs text-center text-muted-foreground mb-1">
                Currently selecting: {selectingDate === 'from' ? 'Start date' : 'End date'}
              </p>
            </div>
            <div className="flex justify-between p-2 border-b">
              <form onSubmit={handleManualDateSubmit} className="flex flex-col space-y-2 w-full">
                <div className="flex gap-2 items-end">
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground mb-1">Start date</p>
                    <Input
                      type="date"
                      value={fromDateInput}
                      onChange={(e) => setFromDateInput(e.target.value)}
                      placeholder="YYYY-MM-DD"
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground mb-1">End date</p>
                    <Input
                      type="date"
                      value={toDateInput}
                      onChange={(e) => setToDateInput(e.target.value)}
                      placeholder="YYYY-MM-DD"
                      className="h-8 text-xs"
                    />
                  </div>
                  <Button type="submit" size="sm" className="h-8">Apply</Button>
                </div>
                {dateInputError && (
                  <p className="text-xs text-red-500">{dateInputError}</p>
                )}
              </form>
            </div>
            <Calendar
              mode="single"
              defaultMonth={dateRange.from}
              selected={selectingDate === 'from' ? dateRange.from : dateRange.to}
              onSelect={handleDateSelect}
              numberOfMonths={2}
              className={cn('p-3 pointer-events-auto')}
              modifiers={{ range: isDateInRange }}
              modifiersStyles={{
                range: { backgroundColor: 'hsl(var(--primary) / 0.1)' },
              }}
              footer={
                <p className="pt-2 text-xs text-center text-muted-foreground">
                  {dateRange.from && format(dateRange.from, 'MMM d, yyyy')} - {dateRange.to ? format(dateRange.to, 'MMM d, yyyy') : 'Select end date'}
                </p>
              }
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  )
}
