'use client';

import { useState } from 'react';
import { format, addMonths, subMonths, addDays, startOfMonth, endOfMonth, parseISO } from 'date-fns';
import { pl } from 'date-fns/locale';
import { Booking } from '@/types/booking';

interface AdminBookingCalendarProps {
  bookings: Booking[];
  selectedDate: string;
  onDateSelect: (date: string) => void;
  onViewBooking: (booking: Booking) => void;
}

interface CalendarDay {
  date: string;
  isCurrentMonth: boolean;
  dayOfMonth: number;
  fullDate: Date;
}

export default function AdminBookingCalendar({
  bookings,
  selectedDate,
  onDateSelect,
  onViewBooking
}: AdminBookingCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  // Получаем даты текущего календаря
  const generateCalendarDates = (month: Date) => {
    const startDate = startOfMonth(month);
    const endDate = endOfMonth(month);
    
    // Добавляем дни до начала месяца для заполнения первой недели
    let day = startDate;
    const calendarDays = [];
    
    // Находим предыдущие дни для заполнения первой недели
    const startDay = startDate.getDay();
    const daysToAdd = startDay === 0 ? 6 : startDay - 1; // Понедельник - первый день недели
    let prevMonthDay = addDays(startDate, -daysToAdd);
    
    for (let i = 0; i < daysToAdd; i++) {
      calendarDays.push({
        date: format(prevMonthDay, 'yyyy-MM-dd'),
        isCurrentMonth: false,
        dayOfMonth: prevMonthDay.getDate(),
        fullDate: prevMonthDay
      });
      prevMonthDay = addDays(prevMonthDay, 1);
    }
    
    // Добавляем все дни текущего месяца
    while (day <= endDate) {
      calendarDays.push({
        date: format(day, 'yyyy-MM-dd'),
        isCurrentMonth: true,
        dayOfMonth: day.getDate(),
        fullDate: new Date(day)
      });
      day = addDays(day, 1);
    }
    
    // Добавляем дни следующего месяца для заполнения последней недели
    const remainingDays = 42 - calendarDays.length; // 6 строк по 7 дней
    let nextMonthDay = addDays(endDate, 1);
    
    for (let i = 0; i < remainingDays; i++) {
      calendarDays.push({
        date: format(nextMonthDay, 'yyyy-MM-dd'),
        isCurrentMonth: false,
        dayOfMonth: nextMonthDay.getDate(),
        fullDate: nextMonthDay
      });
      nextMonthDay = addDays(nextMonthDay, 1);
    }
    
    return calendarDays;
  };
  
  const calendarDays = generateCalendarDates(currentMonth);
  
  // Перейти к предыдущему месяцу
  const goToPreviousMonth = () => {
    setCurrentMonth(prevMonth => subMonths(prevMonth, 1));
  };
  
  // Перейти к следующему месяцу
  const goToNextMonth = () => {
    setCurrentMonth(prevMonth => addMonths(prevMonth, 1));
  };
  
  // Перейти к текущему месяцу
  const goToCurrentMonth = () => {
    setCurrentMonth(new Date());
  };
  
  // Получаем бронирования на определенную дату
  const getBookingsForDate = (date: string) => {
    if (!date || !bookings || !Array.isArray(bookings) || bookings.length === 0) {
      console.log(`Нет данных для фильтрации на дату ${date}:`, { date, bookingsLength: bookings?.length || 0 });
      return [];
    }
    
    // Добавим детальный отладочный вывод для конкретной интересующей даты
    // Польский формат даты может быть "6 maja 2025", мы ищем соответствие с "2025-05-06"
    const isTargetDate = date === '2025-05-06';
    if (isTargetDate) {
      console.log('============== ДИАГНОСТИКА БРОНИРОВАНИЙ ==============');
      console.log(`Поиск бронирований на дату: ${date}`);
      console.log(`Всего бронирований в системе: ${bookings.length}`);
      
      // Проверим все даты в бронированиях
      const dateSummary = bookings.map(booking => ({
        id: booking.id,
        date: booking.date,
        bookingDate: booking.bookingDate,
        // Используем только поля, существующие в типе Booking
        createdAt: booking.createdAt
      }));
      console.log('Сводка дат во всех бронированиях:', dateSummary);
    }
    
    // Преобразуем дату в альтернативные форматы для сравнения
    // Из '2025-05-06' получаем '6 maja 2025' (польский формат)
    const dateParts = date.split('-');
    if (dateParts.length === 3) {
      const year = dateParts[0];
      const month = parseInt(dateParts[1], 10);
      const day = parseInt(dateParts[2], 10);
      
      // Преобразуем месяц в польское название
      const polishMonths = ['stycznia', 'lutego', 'marca', 'kwietnia', 'maja', 
                         'czerwca', 'lipca', 'sierpnia', 'września', 
                         'października', 'listopada', 'grudnia'];
      const polishMonthName = polishMonths[month - 1];
      
      // Сформируем польский формат даты: День Месяц Год
      const polishDateFormat = `${day} ${polishMonthName} ${year}`;
      
      if (isTargetDate) {
        console.log(`Альтернативный формат даты для поиска: ${polishDateFormat}`);
      }
      
      // Фильтруем бронирования, проверяя различные форматы дат
      const filtered = bookings.filter(booking => {
        if (!booking) return false;
        
        // Проверяем разные форматы и поля дат
        const bookingDate = booking.date;
        const bookingDateAlt = booking.bookingDate;
        
        // Также проверяем альтернативный польский формат
        const matchesDate = (bookingDate && bookingDate === date);
        const matchesAltDate = (bookingDateAlt && bookingDateAlt === date);
        const matchesPolishFormat = (booking.date === polishDateFormat || 
                                    booking.bookingDate === polishDateFormat);
        
        if (isTargetDate && (matchesDate || matchesAltDate || matchesPolishFormat)) {
          console.log('НАЙДЕНО соответствующее бронирование:', booking);
        }
        
        return matchesDate || matchesAltDate || matchesPolishFormat;
      });
      
      if (isTargetDate) {
        console.log(`Найдено ${filtered.length} бронирований на дату ${date}`);
        console.log('============ КОНЕЦ ДИАГНОСТИКИ ============');
      }
      
      return filtered;
    }
    
    // Стандартная фильтрация, если дата не в формате YYYY-MM-DD
    return bookings.filter(booking => {
      if (!booking) return false;
      return (booking.date && booking.date === date) || 
             (booking.bookingDate && booking.bookingDate === date);
    });
  };
  
  // Проверяем, есть ли на эту дату бронирования
  const hasBookingsForDate = (date: string) => {
    return getBookingsForDate(date).length > 0;
  };
  
  // Получаем классы для даты календаря
  const getDateClasses = (calendarDay: CalendarDay) => {
    const isSelected = calendarDay.date === selectedDate;
    const hasBookings = hasBookingsForDate(calendarDay.date);
    
    let classes = "h-10 w-10 rounded-full flex items-center justify-center text-sm relative ";
    
    if (!calendarDay.isCurrentMonth) {
      classes += "text-gray-500 ";
    } else {
      classes += "text-white ";
    }
    
    if (isSelected) {
      classes += "bg-[#f36e21] text-white ";
    } else if (hasBookings) {
      classes += "hover:bg-gray-700 ";
    } else {
      classes += "hover:bg-gray-800 ";
    }
    
    return classes;
  };
  
  return (
    <div className="space-y-6">
      {/* Заголовок календаря */}
      <div className="flex justify-between items-center">
        <div className="flex items-center">
          <button
            onClick={goToPreviousMonth}
            className="p-2 text-gray-400 hover:text-white"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <h2 className="text-xl font-semibold text-white mx-4">
            {format(currentMonth, 'LLLL yyyy', { locale: pl })}
          </h2>
          
          <button
            onClick={goToNextMonth}
            className="p-2 text-gray-400 hover:text-white"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
        
        <button
          onClick={goToCurrentMonth}
          className="text-sm text-gray-400 hover:text-white bg-gray-800 px-3 py-1 rounded-full"
        >
          Dzisiaj
        </button>
      </div>
      
      {/* Дни недели */}
      <div className="grid grid-cols-7 gap-2 mb-2">
        {['Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob', 'Nie'].map(day => (
          <div key={day} className="text-center text-sm font-medium text-gray-400">
            {day}
          </div>
        ))}
      </div>
      
      {/* Сетка календаря */}
      <div className="grid grid-cols-7 gap-2">
        {calendarDays.map((day, index) => (
          <div key={index} className="min-h-[80px]">
            <button
              onClick={() => onDateSelect(day.date)}
              className={getDateClasses(day)}
            >
              {day.dayOfMonth}
              
              {hasBookingsForDate(day.date) && day.date !== selectedDate && (
                <span className="absolute bottom-0 right-0 h-2 w-2 bg-[#f36e21] rounded-full"></span>
              )}
            </button>
            
            {/* Список бронирований на этот день */}
            {day.date === selectedDate && (
              <div className="mt-2">
                {getBookingsForDate(day.date).length === 0 ? (
                  <p className="text-xs text-gray-500 text-center">Brak rezerwacji</p>
                ) : (
                  <div className="space-y-1 mt-1">
                    {getBookingsForDate(day.date).map(booking => (
                      <button
                        key={booking.id}
                        onClick={() => onViewBooking(booking)}
                        className="w-full text-left px-2 py-1 text-xs bg-gray-800 hover:bg-gray-700 rounded transition-colors block truncate"
                      >
                        <div className="flex items-center justify-between">
                          <span className="truncate">{booking.startTime}</span>
                          <span className={`h-2 w-2 rounded-full ${
                            booking.paymentStatus === 'FULLY_PAID' ? 'bg-green-500' :
                            booking.paymentStatus === 'DEPOSIT_PAID' ? 'bg-yellow-500' :
                            'bg-red-500'
                          }`}></span>
                        </div>
                        <span className="truncate block text-gray-400">{booking.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
      
      {/* Подробная информация о выбранном дне */}
      <div className="mt-8 bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-medium text-white mb-4">
          {format(parseISO(selectedDate), 'd MMMM yyyy', { locale: pl })}
        </h3>
        
        {getBookingsForDate(selectedDate).length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            Brak rezerwacji na ten dzień
          </div>
        ) : (
          <div className="space-y-4">
            {getBookingsForDate(selectedDate)
              .sort((a, b) => a.startTime.localeCompare(b.startTime))
              .map(booking => (
                <div 
                  key={booking.id} 
                  className="bg-gray-700 rounded-lg p-4 cursor-pointer hover:bg-gray-600 transition-colors"
                  onClick={() => onViewBooking(booking)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-white font-medium">
                          {booking.startTime} - {booking.endTime}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-600 text-gray-300">
                          Pokój {booking.roomId}
                        </span>
                      </div>
                      
                      <p className="text-sm text-gray-300 mt-1">
                        {booking.name} • {booking.email} • {booking.phone}
                      </p>
                      
                      <p className="text-sm text-gray-300 mt-1">
                        {booking.packageName} • {booking.numberOfPeople} {booking.numberOfPeople === 1 ? 'osoba' : 'osoby'}
                      </p>
                    </div>
                    
                    <div className="flex flex-col items-end">
                      <span className="text-lg font-bold text-white">
                        {booking.totalAmount} PLN
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full mt-1 ${
                        booking.paymentStatus === 'FULLY_PAID' ? 'bg-green-500/20 text-green-300' :
                        booking.paymentStatus === 'DEPOSIT_PAID' ? 'bg-yellow-500/20 text-yellow-300' :
                        'bg-red-500/20 text-red-300'
                      }`}>
                        {booking.paymentStatus === 'FULLY_PAID' ? 'Opłacone w całości' :
                         booking.paymentStatus === 'DEPOSIT_PAID' ? 'Wpłacony zadatek' :
                         'Nieopłacone'}
                      </span>
                    </div>
                  </div>
                  
                  {(booking.comment || booking.adminComment) && (
                    <div className="mt-3 pt-3 border-t border-gray-600">
                      {booking.comment && (
                        <p className="text-sm text-gray-300">
                          <span className="text-gray-400">Komentarz: </span>
                          {booking.comment}
                        </p>
                      )}
                      
                      {booking.adminComment && (
                        <p className="text-sm text-yellow-300 mt-1">
                          <span className="text-yellow-400">Admin: </span>
                          {booking.adminComment}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
} 