
import { useState } from "react";
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  isWithinInterval, 
  subMonths, 
  startOfDay, 
  endOfDay, 
  startOfYear, 
  endOfYear, 
  parse, 
  isValid 
} from "date-fns";

interface UseSelectedDateRangeProps {
  initialFrom: Date;
  initialTo: Date;
}

export function useSelectedDateRange({ initialFrom, initialTo }: UseSelectedDateRangeProps) {
  // Date range state
  const [dateRange, setDateRange] = useState<{
    from: Date;
    to: Date | undefined;
  }>({
    from: initialFrom,
    to: initialTo
  });

  // Track which date we're currently selecting (start or end)
  const [selectingDate, setSelectingDate] = useState<'from' | 'to'>('from');
  
  // For manual date inputs
  const [fromDateInput, setFromDateInput] = useState(format(dateRange.from, "yyyy-MM-dd"));
  const [toDateInput, setToDateInput] = useState(dateRange.to ? format(dateRange.to, "yyyy-MM-dd") : "");
  const [dateInputError, setDateInputError] = useState("");

  // Date range preset options
  const dateRangePresets = [
    { 
      name: "This Month", 
      range: () => ({ 
        from: startOfMonth(new Date()), 
        to: endOfMonth(new Date()) 
      })
    },
    { 
      name: "Last Month", 
      range: () => {
        const lastMonth = subMonths(new Date(), 1);
        return { 
          from: startOfMonth(lastMonth), 
          to: endOfMonth(lastMonth) 
        };
      }
    },
    { 
      name: "Last 30 Days", 
      range: () => ({ 
        from: startOfDay(subMonths(new Date(), 1)), 
        to: endOfDay(new Date()) 
      })
    },
    { 
      name: "This Year", 
      range: () => ({ 
        from: startOfYear(new Date()), 
        to: endOfYear(new Date()) 
      })
    }
  ];

  // Update input fields when dateRange changes
  const updateDateInputs = () => {
    setFromDateInput(format(dateRange.from, "yyyy-MM-dd"));
    if (dateRange.to) {
      setToDateInput(format(dateRange.to, "yyyy-MM-dd"));
    }
  };

  // Apply preset date range
  const applyDateRangePreset = (presetIndex: number) => {
    const newRange = dateRangePresets[presetIndex].range();
    setDateRange(newRange);
    updateDateInputs();
  };

  // Handle date selection in calendar
  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;

    // If we're selecting the 'from' date
    if (selectingDate === 'from') {
      // If the selected date is after the end date, adjust the end date
      if (dateRange.to && date > dateRange.to) {
        setDateRange({ from: date, to: undefined });
      } else {
        setDateRange({ ...dateRange, from: date });
      }
      // Toggle to selecting the 'to' date
      setSelectingDate('to');
    } 
    // If we're selecting the 'to' date
    else {
      // If the selected date is before the start date, we're actually reselecting the start date
      if (date < dateRange.from) {
        setDateRange({ from: date, to: dateRange.from });
      } else {
        setDateRange({ ...dateRange, to: date });
      }
      // Toggle to selecting the 'from' date
      setSelectingDate('from');
    }
    
    // Update input fields
    updateDateInputs();
  };

  // Handle manual date input submission
  const handleManualDateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setDateInputError("");
    
    try {
      // Parse the input dates
      const fromDate = parse(fromDateInput, "yyyy-MM-dd", new Date());
      const toDate = toDateInput ? parse(toDateInput, "yyyy-MM-dd", new Date()) : undefined;
      
      // Validate the dates
      if (!isValid(fromDate)) {
        setDateInputError("Invalid start date format");
        return;
      }
      
      if (toDateInput && !isValid(toDate)) {
        setDateInputError("Invalid end date format");
        return;
      }
      
      if (toDate && fromDate > toDate) {
        setDateInputError("Start date cannot be after end date");
        return;
      }
      
      // Set the new date range
      setDateRange({
        from: fromDate,
        to: toDate
      });
    } catch (error) {
      setDateInputError("Error parsing dates. Please use YYYY-MM-DD format.");
    }
  };

  // Helper function to create date modifier to highlight the range
  const createDateModifier = (dateRange: { from: Date; to: Date | undefined }) => {
    return (date: Date) => {
      if (!dateRange.to) {
        return date.getTime() === dateRange.from.getTime();
      }
      return isWithinInterval(date, { start: dateRange.from, end: dateRange.to });
    };
  };

  // Create a date modifier for the selected range
  const isDateInRange = createDateModifier(dateRange);

  return {
    dateRange,
    setDateRange,
    selectingDate,
    setSelectingDate,
    fromDateInput,
    setFromDateInput,
    toDateInput,
    setToDateInput,
    dateInputError,
    setDateInputError,
    dateRangePresets,
    applyDateRangePreset,
    handleDateSelect,
    handleManualDateSubmit,
    isDateInRange
  };
}
