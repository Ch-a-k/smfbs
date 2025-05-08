'use client';

import { useState } from 'react';
import { Calendar as CalendarIcon } from 'lucide-react';
import { format, addMonths, subMonths, isSameMonth, isSameDay, addDays, startOfMonth, endOfMonth, isBefore, isToday } from 'date-fns';
import { pl, enUS } from 'date-fns/locale';
import { useI18n } from '@/i18n/I18nContext';

interface BookingCalendarProps {
  selectedDate: Date | null;
  onChange: (date: Date) => void;
}

export default function BookingCalendar({ selectedDate, onChange }: BookingCalendarProps) {
  const { t, locale } = useI18n();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  // Define locale for date formatting
  const dateLocale = locale === 'pl' ? pl : enUS;
  
  // Get month name
  const monthName = format(currentMonth, 'LLLL yyyy', { locale: dateLocale });
  
  // Generate calendar days
  const generateCalendarDays = () => {
    const days = [];
    const firstDayOfMonth = startOfMonth(currentMonth);
    const lastDayOfMonth = endOfMonth(currentMonth);
    
    // Determine the first day to display (start of week)
    let startDate = firstDayOfMonth;
    const firstDayOfWeek = startDate.getDay();
    // Sunday in JS is 0, but for our calendar Monday is the first day (1)
    // Therefore we subtract the appropriate number of days
    const daysToSubtract = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;
    startDate = addDays(startDate, -daysToSubtract);
    
    // Generate 42 days (6 rows of 7 days)
    for (let i = 0; i < 42; i++) {
      const day = addDays(startDate, i);
      days.push({
        date: day,
        isCurrentMonth: isSameMonth(day, currentMonth),
        isToday: isToday(day),
        isSelected: selectedDate ? isSameDay(day, selectedDate) : false,
        isDisabled: isBefore(day, new Date()) && !isToday(day) // Disallow selection of past dates
      });
    }
    
    return days;
  };
  
  const days = generateCalendarDays();
  
  // Go to previous month
  const goToPreviousMonth = () => {
    setCurrentMonth(prev => subMonths(prev, 1));
  };
  
  // Go to next month
  const goToNextMonth = () => {
    setCurrentMonth(prev => addMonths(prev, 1));
  };
  
  // Go to current month
  const goToCurrentMonth = () => {
    setCurrentMonth(new Date());
  };
  
  // Get day names from translation
  const getDayNames = () => {
    const dayNamesString = t('booking.calendar.dayNames');
    return dayNamesString.split('_');
  };
  
  return (
    <div className="rounded-lg bg-black/40 border border-white/10 backdrop-blur-sm shadow p-3 sm:p-4">
      {/* Calendar header */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-3 mb-4">
        <div className="flex items-center w-full sm:w-auto justify-between sm:justify-start">
          <button
            onClick={goToPreviousMonth}
            className="p-2 text-gray-400 hover:text-[#f36e21] transition-colors"
            aria-label={t('booking.calendar.prevMonth')}
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <h2 className="text-lg font-medium text-white mx-2 capitalize">
            {monthName}
          </h2>
          
          <button
            onClick={goToNextMonth}
            className="p-2 text-gray-400 hover:text-[#f36e21] transition-colors"
            aria-label={t('booking.calendar.nextMonth')}
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
        
        <button
          onClick={goToCurrentMonth}
          className="flex items-center text-sm bg-black/60 hover:bg-black/80 text-white py-1 px-3 rounded-lg transition-colors border border-white/10 w-full sm:w-auto justify-center"
        >
          <CalendarIcon className="h-4 w-4 mr-1" />
          <span>{t('booking.calendar.today')}</span>
        </button>
      </div>
      
      {/* Day names */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {getDayNames().map((day: string) => (
          <div key={day} className="text-center text-sm font-medium text-gray-400 p-1">
            {day}
          </div>
        ))}
      </div>
      
      {/* Days grid */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, index) => (
          <button
            key={index}
            onClick={() => !day.isDisabled && onChange(day.date)}
            disabled={day.isDisabled}
            className={`
              h-10 md:h-12 w-full rounded-md flex items-center justify-center text-sm
              ${!day.isCurrentMonth ? 'text-gray-500' : 'text-white'}
              ${day.isDisabled ? 'cursor-not-allowed opacity-30' : 'hover:bg-black/60'}
              ${day.isToday ? 'border border-white/20' : ''}
              ${day.isSelected ? 'bg-[#f36e21] text-white hover:bg-[#f36e21]/90' : ''}
            `}
          >
            {format(day.date, 'd')}
          </button>
        ))}
      </div>
    </div>
  );
} 