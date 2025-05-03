'use client';

import { useState, useEffect, useMemo } from 'react';
import { PaymentStatus, Booking } from '@/types/booking';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import AdminBookingList from './AdminBookingList';
import AdminBookingDetails from './AdminBookingDetails';
import AdminCreateBooking from './AdminCreateBooking';

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
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>(bookings);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showNewBooking, setShowNewBooking] = useState(false);
  
  // Обновляем отфильтрованные бронирования при изменении фильтров или бронирований
  useEffect(() => {
    filterBookings();
  }, [bookings, selectedDate, filterStatus, searchTerm]);
  
  // Функция фильтрации бронирований
  const filterBookings = () => {
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
        (typeof booking.name === 'string' && booking.name.toLowerCase().includes(search)) ||
        (typeof booking.email === 'string' && booking.email.toLowerCase().includes(search)) ||
        (typeof booking.phone === 'string' && booking.phone.toString().includes(search)) ||
        (typeof booking.packageName === 'string' && booking.packageName.toLowerCase().includes(search)) ||
        booking.roomId.toString().includes(search) ||
        booking.totalAmount.toString().includes(search)
      );
    }
    
    setFilteredBookings(filtered);
    return filtered;
  };
  
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-3 sm:space-y-0">
        <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as PaymentStatus | 'ALL')}
            className="px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500 text-sm"
          >
            <option value="ALL">Все статусы</option>
            <option value="UNPAID">Неоплаченные</option>
            <option value="DEPOSIT_PAID">Частично оплаченные</option>
            <option value="FULLY_PAID">Полностью оплаченные</option>
          </select>
          
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder="Поиск по имени, email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500 text-sm"
            />
            <div className="absolute left-3 top-2.5 text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2 w-full sm:w-auto justify-between sm:justify-end">
          {selectedDate && (
            <div className="flex items-center">
              <span className="mr-2 text-sm font-medium">
                {format(new Date(selectedDate), 'dd MMMM yyyy', { locale: ru })}
              </span>
              <button
                onClick={handleClearDate}
                className="text-red-500 hover:text-red-700 text-sm"
              >
                ✕
              </button>
            </div>
          )}
          
          <button
            onClick={handleClearAllFilters}
            className="px-3 py-1 text-xs bg-gray-200 hover:bg-gray-300 rounded"
          >
            Сбросить фильтры
          </button>
          
          <button
            onClick={handleCreateBooking}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
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
          bookings={filterBookings()}
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