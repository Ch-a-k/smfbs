'use client';

import { useState, useEffect } from 'react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isBefore, addDays } from 'date-fns';
import { pl } from 'date-fns/locale';

interface CalendarProps {
  onDateSelect: (date: string) => void;
}

export function Calendar({ onDateSelect }: CalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  
  // Преобразуем все даты месяца
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
  // Названия дней недели на польском
  const weekDays = ['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'Sb', 'Nd'];
  
  // Обработчик выбора даты
  const handleDateClick = (day: Date) => {
    // Проверяем, что дата не в прошлом и не ранее сегодня
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (isBefore(day, today)) {
      return;
    }
    
    setSelectedDate(day);
    onDateSelect(format(day, 'yyyy-MM-dd'));
  };
  
  // Переход к следующему месяцу
  const nextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };
  
  // Переход к предыдущему месяцу
  const prevMonth = () => {
    // Убедимся, что не можем перейти к месяцу ранее текущего
    const prevMonthDate = subMonths(currentMonth, 1);
    const today = new Date();
    
    if (isBefore(prevMonthDate, today) && !isSameMonth(prevMonthDate, today)) {
      return;
    }
    
    setCurrentMonth(prevMonthDate);
  };
  
  return (
    <div className="bg-[#231f20] rounded-lg p-4 shadow-md">
      <div className="flex justify-between items-center mb-4">
        <button
          onClick={prevMonth}
          className="p-2 rounded-full hover:bg-[#333] transition-colors"
        >
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        <h2 className="text-lg font-bold text-white">
          {format(currentMonth, 'LLLL yyyy', { locale: pl })}
        </h2>
        
        <button
          onClick={nextMonth}
          className="p-2 rounded-full hover:bg-[#333] transition-colors"
        >
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
      
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map(day => (
          <div key={day} className="text-center text-white/70 text-sm py-1">
            {day}
          </div>
        ))}
      </div>
      
      <div className="grid grid-cols-7 gap-1">
        {monthDays.map(day => {
          // Проверяем, доступна ли дата для выбора
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const isDisabled = isBefore(day, today);
          
          // Проверяем, выбрана ли эта дата
          const isSelected = selectedDate ? format(day, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd') : false;
          
          return (
            <div
              key={day.toString()}
              onClick={() => !isDisabled && handleDateClick(day)}
              className={`
                p-2 rounded-md text-center cursor-pointer
                ${isToday(day) ? 'border border-[#f36e21]' : ''}
                ${isDisabled ? 'text-gray-600 cursor-not-allowed' : 'text-white hover:bg-[#333]'}
                ${isSelected ? 'bg-[#f36e21] text-white hover:bg-[#f36e21]' : ''}
              `}
            >
              {format(day, 'd')}
            </div>
          );
        })}
      </div>
    </div>
  );
} 