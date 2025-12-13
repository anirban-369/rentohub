'use client'

import { useState } from 'react'
import { addDays, format, isSameDay, isAfter, isBefore } from 'date-fns'

interface DateRangePickerProps {
  onSelect: (startDate: Date, endDate: Date) => void
  blockedDates?: Date[]
  minDate?: Date
  maxDate?: Date
}

export default function DateRangePicker({
  onSelect,
  blockedDates = [],
  minDate = new Date(),
  maxDate = addDays(new Date(), 365),
}: DateRangePickerProps) {
  const [startDate, setStartDate] = useState<Date | null>(null)
  const [endDate, setEndDate] = useState<Date | null>(null)
  const [hoveredDate, setHoveredDate] = useState<Date | null>(null)
  const [currentMonth, setCurrentMonth] = useState(new Date())

  function isDateBlocked(date: Date): boolean {
    return blockedDates.some((blocked) => isSameDay(blocked, date))
  }

  function isDateDisabled(date: Date): boolean {
    return (
      isBefore(date, minDate) ||
      isAfter(date, maxDate) ||
      isDateBlocked(date)
    )
  }

  function isDateInRange(date: Date): boolean {
    if (!startDate || !endDate) return false
    return isAfter(date, startDate) && isBefore(date, endDate)
  }

  function isDateSelected(date: Date): boolean {
    if (!startDate) return false
    if (!endDate) return isSameDay(date, startDate)
    return isSameDay(date, startDate) || isSameDay(date, endDate)
  }

  function handleDateClick(date: Date) {
    if (isDateDisabled(date)) return

    if (!startDate || (startDate && endDate)) {
      setStartDate(date)
      setEndDate(null)
      return
    }

    if (isBefore(date, startDate)) {
      setStartDate(date)
      setEndDate(null)
      return
    }

    // Check if any blocked dates exist between startDate and date
    let current = addDays(startDate, 1)
    while (isBefore(current, date)) {
      if (isDateBlocked(current)) {
        alert('Cannot select range with blocked dates')
        return
      }
      current = addDays(current, 1)
    }

    setEndDate(date)
    onSelect(startDate, date)
  }

  function getDaysInMonth(date: Date): Date[] {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const days: Date[] = []

    // Add padding days from previous month
    const startPadding = firstDay.getDay()
    for (let i = startPadding - 1; i >= 0; i--) {
      days.push(addDays(firstDay, -i - 1))
    }

    // Add days of current month
    for (let day = 1; day <= lastDay.getDate(); day++) {
      days.push(new Date(year, month, day))
    }

    return days
  }

  const daysInMonth = getDaysInMonth(currentMonth)

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 max-w-md">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={() =>
            setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() - 1)))
          }
          className="p-2 hover:bg-gray-100 rounded"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h3 className="text-lg font-semibold">
          {format(currentMonth, 'MMMM yyyy')}
        </h3>
        <button
          type="button"
          onClick={() =>
            setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() + 1)))
          }
          className="p-2 hover:bg-gray-100 rounded"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Weekday Headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
          <div key={day} className="text-center text-sm font-medium text-gray-600 py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Days */}
      <div className="grid grid-cols-7 gap-1">
        {daysInMonth.map((date, index) => {
          const isDisabled = isDateDisabled(date)
          const isSelected = isDateSelected(date)
          const isInRange = isDateInRange(date)
          const isCurrentMonth = date.getMonth() === currentMonth.getMonth()

          return (
            <button
              key={index}
              type="button"
              onClick={() => handleDateClick(date)}
              onMouseEnter={() => setHoveredDate(date)}
              onMouseLeave={() => setHoveredDate(null)}
              disabled={isDisabled}
              className={`
                aspect-square p-2 text-sm rounded-lg transition
                ${!isCurrentMonth && 'text-gray-400'}
                ${isDisabled && 'cursor-not-allowed opacity-30'}
                ${isSelected && 'bg-primary-600 text-white font-semibold'}
                ${isInRange && 'bg-primary-100'}
                ${
                  !isDisabled &&
                  !isSelected &&
                  !isInRange &&
                  'hover:bg-gray-100'
                }
              `}
            >
              {date.getDate()}
            </button>
          )
        })}
      </div>

      {/* Selected Range Display */}
      {startDate && (
        <div className="mt-4 pt-4 border-t text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Start:</span>
            <span className="font-medium">{format(startDate, 'MMM dd, yyyy')}</span>
          </div>
          {endDate && (
            <div className="flex justify-between mt-2">
              <span className="text-gray-600">End:</span>
              <span className="font-medium">{format(endDate, 'MMM dd, yyyy')}</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
