'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { PaymentStatus, Booking } from '@/types/booking';
import { format, isToday } from 'date-fns';
import { ru, pl } from 'date-fns/locale';
import AdminBookingList from './AdminBookingList';
import AdminBookingDetails from './AdminBookingDetails';
import AdminCreateBooking from './AdminCreateBooking';
import { Calendar, Search, X, Filter, ChevronDown } from 'lucide-react';

interface AdminBookingManagerProps {
  bookings: Booking[];
  selectedDate?: string;
  onViewBooking: (booking: Booking) => void;
  onDateSelect?: (date: string | null) => void;
  isLoading?: boolean;
}

export default function AdminBookingManager({
  bookings,
  selectedDate,
  onViewBooking,
  onDateSelect,
  isLoading = false
}: AdminBookingManagerProps) {
  const [filterStatus, setFilterStatus] = useState<PaymentStatus | 'ALL'>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showNewBooking, setShowNewBooking] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showStatusFilter, setShowStatusFilter] = useState(false);
  const datePickerRef = useRef<HTMLDivElement>(null);
  const statusFilterRef = useRef<HTMLDivElement>(null);
  
  // Закрытие выпадающих меню при клике вне их
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      // Обработка клика вне календаря
      if (datePickerRef.current && !datePickerRef.current.contains(event.target as Node)) {
        setShowDatePicker(false);
      }
      
      // Обработка клика вне фильтра статусов
      if (statusFilterRef.current && !statusFilterRef.current.contains(event.target as Node)) {
        setShowStatusFilter(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Вместо вызова функции filterBookings и обновления состояния в useEffect,
  // используем useMemo для вычисления отфильтрованных бронирований
  const filteredBookings = useMemo(() => {
    let filtered = [...bookings];
    
    // Фильтр по дате
    if (selectedDate) {
      filtered = filtered.filter(booking => booking.date === selectedDate);
    }
    
    // Фильтр по статусу оплаты
    if (filterStatus !== 'ALL') {
      filtered = filtered.filter(booking => booking.paymentStatus === filterStatus);
    }
    
    // Фильтр по поисковому запросу
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(booking => 
        (booking.name && booking.name.toLowerCase().includes(search)) ||
        (booking.customerName && booking.customerName.toLowerCase().includes(search)) ||
        (booking.email && booking.email.toLowerCase().includes(search)) ||
        (booking.customerEmail && booking.customerEmail.toLowerCase().includes(search)) ||
        (booking.phone && booking.phone.toString().includes(search)) ||
        (booking.customerPhone && booking.customerPhone.toString().includes(search)) ||
        (booking.packageName && booking.packageName.toLowerCase().includes(search)) ||
        (booking.roomId && booking.roomId.toString().includes(search)) ||
        (booking.totalAmount !== undefined && booking.totalAmount.toString().includes(search))
      );
    }
    
    return filtered;
  }, [bookings, selectedDate, filterStatus, searchTerm]);
  
  const getPaymentStatusText = (status: PaymentStatus): string => {
    switch (status) {
      case 'FULLY_PAID': return 'Opłacone';
      case 'DEPOSIT_PAID': return 'Zaliczka';
      case 'UNPAID': return 'Nieopłacone';
      default: return status;
    }
  };
  
  const handleClearDate = () => {
    if (onDateSelect) {
      onDateSelect(null);
    }
    setShowDatePicker(false);
  };
  
  const handleClearAllFilters = () => {
    setFilterStatus('ALL');
    setSearchTerm('');
    handleClearDate();
  };
  
  const handleViewBooking = (booking: Booking) => {
    setSelectedBooking(booking);
  };
  
  const handleCloseBookingDetails = () => {
    setSelectedBooking(null);
  };
  
  const handleCreateBooking = () => {
    setShowNewBooking(true);
  };
  
  const handleCloseNewBooking = (shouldRefresh: boolean = false) => {
    setShowNewBooking(false);
    // Если был создан новый бронь, обновляем список
    if (shouldRefresh) {
      // Здесь можно добавить обновление списка бронирований
    }
  };

  const handleDateSelect = (date: string) => {
    if (onDateSelect) {
      onDateSelect(date);
    }
    setShowDatePicker(false);
  };

  const handleStatusSelect = (status: PaymentStatus | 'ALL') => {
    setFilterStatus(status);
    setShowStatusFilter(false);
  };

  // Генерация календаря выбора даты
  const renderDatePicker = () => {
    const today = new Date();
    const month = today.getMonth();
    const year = today.getFullYear();
    
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    
    // Создаем массив дней месяца
    const days = [];
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    
    // Добавляем пустые ячейки в начало для правильного отображения календаря
    const emptyDaysStart = Array(firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1).fill(null);
    
    const getDayClass = (day: number) => {
      const date = new Date(year, month, day);
      const dateString = format(date, 'yyyy-MM-dd');
      const hasBookings = bookings.some(booking => booking.date === dateString);
      
      let classes = "w-10 h-10 rounded-full flex items-center justify-center cursor-pointer ";
      
      if (isToday(date)) {
        classes += "bg-blue-600 text-white hover:bg-blue-700 ";
      } else {
        classes += "hover:bg-gray-700 ";
      }
      
      if (hasBookings) {
        classes += "font-bold border border-[#f36e21] ";
      }
      
      if (selectedDate === dateString) {
        classes += "ring-2 ring-[#f36e21] ring-offset-2 ring-offset-gray-800 ";
      }
      
      return classes;
    };
    
    return (
      <div ref={datePickerRef} className="absolute z-50 mt-2 bg-gray-800 rounded-lg shadow-lg p-4 animate-fade-in w-[280px] sm:w-[320px] right-0 sm:right-auto">
        <div className="mb-4 flex justify-between items-center">
          <h3 className="text-white font-medium">
            {format(new Date(year, month), 'MMMM yyyy', { locale: pl })}
          </h3>
          <button 
            onClick={() => setShowDatePicker(false)}
            className="text-gray-400 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>
        
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'So', 'Nd'].map((day, index) => (
            <div key={index} className="text-center text-xs text-gray-400 p-1">
              {day}
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-7 gap-2">
          {emptyDaysStart.map((_, index) => (
            <div key={`empty-start-${index}`} className="w-10 h-10"></div>
          ))}
          
          {days.map(day => (
            <div
              key={`day-${day}`}
              className={getDayClass(day)}
              onClick={() => handleDateSelect(format(new Date(year, month, day), 'yyyy-MM-dd'))}
            >
              {day}
            </div>
          ))}
        </div>
        
        <div className="mt-4 flex justify-between">
          <button 
            onClick={handleClearDate} 
            className="text-sm text-red-400 hover:text-red-300"
          >
            Wyczyść datę
          </button>
          <button 
            onClick={() => handleDateSelect(format(new Date(), 'yyyy-MM-dd'))}
            className="text-sm text-blue-400 hover:text-blue-300"
          >
            Dzisiaj
          </button>
        </div>
      </div>
    );
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#f36e21]"></div>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {/* Верхняя панель с фильтрами */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-3 sm:space-y-0 bg-gray-800 p-4 rounded-lg shadow">
        <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto">
          <div className="relative" ref={statusFilterRef}>
            <button
              onClick={() => setShowStatusFilter(!showStatusFilter)}
              className="flex items-center bg-gray-700 hover:bg-gray-600 text-white px-3 py-2 rounded-md text-sm transition-colors"
            >
              <Filter className="mr-2 h-4 w-4" />
              {filterStatus === 'ALL' ? 'Все статусы' : getPaymentStatusText(filterStatus)}
              <ChevronDown className="ml-2 h-4 w-4" />
            </button>
            
            {/* Выпадающее меню для фильтра */}
            {showStatusFilter && (
              <div className="absolute left-0 mt-1 w-48 rounded-md shadow-lg bg-gray-700 z-10">
                <div className="py-1 rounded-md bg-gray-700 shadow-xs">
                  <button
                    onClick={() => handleStatusSelect('ALL')}
                    className={`block px-4 py-2 text-sm leading-5 text-white w-full text-left ${filterStatus === 'ALL' ? 'bg-gray-600' : 'hover:bg-gray-600'}`}
                  >
                    Все статусы
                  </button>
                  <button
                    onClick={() => handleStatusSelect('UNPAID')}
                    className={`block px-4 py-2 text-sm leading-5 text-white w-full text-left ${filterStatus === 'UNPAID' ? 'bg-gray-600' : 'hover:bg-gray-600'}`}
                  >
                    Nieopłacone
                  </button>
                  <button
                    onClick={() => handleStatusSelect('DEPOSIT_PAID')}
                    className={`block px-4 py-2 text-sm leading-5 text-white w-full text-left ${filterStatus === 'DEPOSIT_PAID' ? 'bg-gray-600' : 'hover:bg-gray-600'}`}
                  >
                    Zaliczka
                  </button>
                  <button
                    onClick={() => handleStatusSelect('FULLY_PAID')}
                    className={`block px-4 py-2 text-sm leading-5 text-white w-full text-left ${filterStatus === 'FULLY_PAID' ? 'bg-gray-600' : 'hover:bg-gray-600'}`}
                  >
                    Opłacone
                  </button>
                </div>
              </div>
            )}
          </div>
          
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder="Поиск по имени, email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-[#f36e21] focus:border-[#f36e21] text-sm text-white"
            />
            <div className="absolute left-3 top-2.5 text-gray-400">
              <Search className="h-4 w-4" />
            </div>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-2.5 text-gray-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-2 w-full sm:w-auto justify-between sm:justify-end">
          <div className="relative">
            <button
              onClick={() => setShowDatePicker(prev => !prev)}
              className="flex items-center bg-gray-700 hover:bg-gray-600 text-white px-3 py-2 rounded-md text-sm transition-colors"
            >
              <Calendar className="mr-2 h-4 w-4" />
              {selectedDate 
                ? format(new Date(selectedDate), 'dd MMMM yyyy', { locale: pl })
                : 'Выбрать дату'
              }
            </button>
            
            {showDatePicker && renderDatePicker()}
          </div>
          
          {(filterStatus !== 'ALL' || searchTerm || selectedDate) && (
            <button
              onClick={handleClearAllFilters}
              className="px-3 py-2 text-xs bg-gray-700 hover:bg-gray-600 rounded-md text-white transition-colors"
            >
              Сбросить фильтры
            </button>
          )}
          
          <button
            onClick={handleCreateBooking}
            className="px-4 py-2 bg-[#f36e21] text-white rounded-md hover:bg-[#ff7b2e] transition-colors text-sm"
          >
            Новое бронирование
          </button>
        </div>
      </div>
      
      {/* Список бронирований */}
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-500"></div>
        </div>
      ) : (
        <AdminBookingList
          bookings={filteredBookings}
          selectedDate={selectedDate}
          onViewBooking={handleViewBooking}
          filterStatus={filterStatus}
          searchTerm={searchTerm}
        />
      )}
      
      {/* Модальное окно с деталями бронирования */}
      {selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4 z-50">
          <div className="bg-white rounded-lg overflow-hidden shadow-xl w-full max-w-4xl">
            <AdminBookingDetails
              booking={selectedBooking}
              onClose={handleCloseBookingDetails}
            />
          </div>
        </div>
      )}
      
      {/* Модальное окно создания нового бронирования */}
      {showNewBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4 z-50">
          <div className="bg-white rounded-lg overflow-hidden shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <AdminCreateBooking
              onClose={handleCloseNewBooking}
            />
          </div>
        </div>
      )}
    </div>
  );
} 