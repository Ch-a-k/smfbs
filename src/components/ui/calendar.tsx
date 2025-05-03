'use client';

import * as React from 'react';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';

interface CalendarProps {
  mode?: 'single' | 'range' | 'multiple';
  selected?: Date | Date[] | undefined;
  onSelect?: (date: Date | undefined) => void;
  className?: string;
}

export function Calendar({
  mode = 'single',
  selected,
  onSelect,
  className = '',
}: CalendarProps) {
  // Упрощенная реализация календаря
  const today = new Date();
  const month = selected instanceof Date ? selected : today;
  const [currentMonth, setCurrentMonth] = React.useState(month);
  
  // Получаем первый день месяца
  const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
  // Получаем последний день месяца
  const lastDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
  
  // Получаем первый день для отображения (может быть из предыдущего месяца)
  const firstDayToDisplay = new Date(firstDayOfMonth);
  firstDayToDisplay.setDate(firstDayToDisplay.getDate() - firstDayOfMonth.getDay() + 1);
  if (firstDayToDisplay.getDay() === 0) { // Если это воскресенье, отступаем еще на неделю
    firstDayToDisplay.setDate(firstDayToDisplay.getDate() - 7);
  }
  
  // Получаем дни для отображения
  const daysToDisplay: Date[] = [];
  for (let i = 0; i < 42; i++) { // 6 недель по 7 дней
    const date = new Date(firstDayToDisplay);
    date.setDate(date.getDate() + i);
    daysToDisplay.push(date);
  }
  
  // Функция для проверки, выбрана ли дата
  const isSelected = (date: Date) => {
    if (!selected) return false;
    
    if (selected instanceof Date) {
      return date.toDateString() === selected.toDateString();
    }
    
    if (Array.isArray(selected)) {
      return selected.some(s => date.toDateString() === s.toDateString());
    }
    
    return false;
  };
  
  // Функция для проверки, является ли дата сегодняшней
  const isToday = (date: Date) => {
    return date.toDateString() === today.toDateString();
  };
  
  // Функция для проверки, принадлежит ли дата текущему месяцу
  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentMonth.getMonth();
  };
  
  // Обработчик выбора даты
  const handleSelect = (date: Date) => {
    if (onSelect) {
      if (isSelected(date)) {
        onSelect(undefined);
      } else {
        onSelect(date);
      }
    }
  };
  
  // Переход к предыдущему месяцу
  const previousMonth = () => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() - 1);
      return newDate;
    });
  };
  
  // Переход к следующему месяцу
  const nextMonth = () => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() + 1);
      return newDate;
    });
  };
  
  return (
    <div className={`p-3 ${className}`}>
      <div className="flex justify-between mb-4">
        <button
          type="button"
          onClick={previousMonth}
          className="p-2 hover:bg-gray-700 rounded-full transition-colors"
        >
          &lsaquo;
        </button>
        <div className="font-semibold">
          {format(currentMonth, 'LLLL yyyy', { locale: pl })}
        </div>
        <button
          type="button"
          onClick={nextMonth}
          className="p-2 hover:bg-gray-700 rounded-full transition-colors"
        >
          &rsaquo;
        </button>
      </div>
      
      <div className="grid grid-cols-7 gap-1 mb-2">
        {['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'So', 'Nd'].map(day => (
          <div key={day} className="text-center text-xs text-gray-400 py-1">
            {day}
          </div>
        ))}
      </div>
      
      <div className="grid grid-cols-7 gap-1">
        {daysToDisplay.map((date, i) => (
          <button
            key={i}
            type="button"
            onClick={() => handleSelect(date)}
            disabled={!isCurrentMonth(date)}
            className={`
              h-9 w-9 text-center rounded-full
              ${isCurrentMonth(date) ? 'text-white' : 'text-gray-500 opacity-50'} 
              ${isSelected(date) ? 'bg-amber-500 text-white hover:bg-amber-600' : ''}
              ${isToday(date) && !isSelected(date) ? 'border border-amber-500' : ''}
              ${isCurrentMonth(date) && !isSelected(date) ? 'hover:bg-gray-700' : ''}
            `}
          >
            {date.getDate()}
          </button>
        ))}
      </div>
    </div>
  );
} 