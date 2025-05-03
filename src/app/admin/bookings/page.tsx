'use client';

import { useState, useEffect } from 'react';
import { format, parseISO, addMonths, subMonths } from 'date-fns';
import { pl } from 'date-fns/locale';
import { Booking, PaymentStatus, BookingFormData } from '@/types/booking';
import AdminBookingCalendar from '@/components/admin/AdminBookingCalendar';
import AdminBookingDetails from '@/components/admin/AdminBookingDetails';
import AdminCreateBooking from '@/components/admin/AdminCreateBooking';
import AdminBookingManager from '@/components/admin/AdminBookingManager';
import Link from 'next/link';

// Типы для вкладок администратора
type AdminTab = 'calendar' | 'list' | 'analytics' | 'create';

export default function AdminBookingsPage() {
  const [activeTab, setActiveTab] = useState<AdminTab>('calendar');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showBookingDetails, setShowBookingDetails] = useState(false);
  
  // Загрузка бронирований
  useEffect(() => {
    fetchBookings();
  }, []);
  
  // Функция загрузки бронирований
  const fetchBookings = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/bookings');
      if (!response.ok) {
        throw new Error('Failed to fetch bookings');
      }
      const data = await response.json();
      setBookings(data);
    } catch (error) {
      console.error('Error loading bookings:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Обработчик просмотра деталей бронирования
  const handleViewBooking = (booking: Booking) => {
    setSelectedBooking(booking);
    setShowBookingDetails(true);
  };
  
  // Обработчик создания нового бронирования
  const handleBookingCreate = async (bookingData: BookingFormData, paymentStatus: PaymentStatus) => {
    try {
      console.log('Создание бронирования с данными:', bookingData, 'Статус оплаты:', paymentStatus);
      
      // Формируем данные для отправки
      const bookingToCreate = {
        ...bookingData,
        // Убедимся, что все числовые поля действительно числа
        roomId: typeof bookingData.roomId === 'string' ? parseInt(bookingData.roomId, 10) : bookingData.roomId,
        numberOfPeople: typeof bookingData.numberOfPeople === 'string' 
          ? parseInt(bookingData.numberOfPeople, 10) 
          : bookingData.numberOfPeople,
        totalAmount: typeof bookingData.totalAmount === 'string' 
          ? parseFloat(bookingData.totalAmount) 
          : bookingData.totalAmount,
        depositAmount: typeof bookingData.depositAmount === 'string' 
          ? parseFloat(bookingData.depositAmount) 
          : bookingData.depositAmount,
        paidAmount: typeof bookingData.paidAmount === 'string' 
          ? parseFloat(bookingData.paidAmount) 
          : bookingData.paidAmount,
        // Добавляем статус оплаты если это админский запрос
        paymentStatus
      };

      // Отображаем точные данные, отправляемые на сервер
      console.log('Данные для отправки на сервер:', JSON.stringify(bookingToCreate, null, 2));

      // Отправляем запрос на создание бронирования
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookingToCreate),
      });

      // Получаем содержимое ответа, независимо от статуса
      const responseText = await response.text();
      console.log('Полученный ответ сервера:', responseText);
      
      // Пробуем преобразовать ответ в JSON
      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch (e) {
        console.error('Не удалось разобрать ответ как JSON:', e);
        throw new Error('Некорректный формат ответа от сервера');
      }

      // Проверяем ответ сервера
      if (!response.ok) {
        const errorMessage = responseData?.error || responseData?.details || 'Не удалось создать бронирование';
        console.error('Ошибка ответа API:', responseData);
        throw new Error(errorMessage);
      }

      console.log('Результат создания бронирования:', responseData);

      // Обновляем список бронирований
      await fetchBookings();
      
      // Возвращаемся к календарю
      setActiveTab('calendar');
      
      // Сообщение об успешном создании (если есть компонент уведомлений)
      alert('Бронирование успешно создано');
    } catch (error) {
      console.error('Ошибка создания бронирования:', error);
      alert(`Ошибка: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
      throw error;
    }
  };
  
  // Обработчик обновления статуса оплаты
  const handlePaymentStatusUpdate = async (bookingId: string | number, newStatus: PaymentStatus) => {
    try {
      const response = await fetch('/api/bookings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: bookingId,
          paymentStatus: newStatus,
          // В реальном приложении здесь нужен токен авторизации для админа
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update payment status');
      }
      
      // Обновляем список бронирований
      await fetchBookings();
      
      // Обновляем выбранное бронирование, если оно было выбрано
      if (selectedBooking && selectedBooking.id === bookingId) {
        const updatedBooking = { ...selectedBooking, paymentStatus: newStatus };
        setSelectedBooking(updatedBooking);
      }
    } catch (error) {
      console.error('Error updating payment status:', error);
      throw error;
    }
  };
  
  // Обработчик обновления комментария администратора
  const handleAdminCommentUpdate = async (bookingId: string | number, comment: string) => {
    try {
      const response = await fetch('/api/bookings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: bookingId,
          adminComment: comment,
          // В реальном приложении здесь нужен токен авторизации для админа
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update admin comment');
      }
      
      // Обновляем список бронирований
      await fetchBookings();
      
      // Обновляем выбранное бронирование, если оно было выбрано
      if (selectedBooking && selectedBooking.id === bookingId) {
        const updatedBooking = { ...selectedBooking, adminComment: comment };
        setSelectedBooking(updatedBooking);
      }
    } catch (error) {
      console.error('Error updating admin comment:', error);
      throw error;
    }
  };
  
  // Обработчик удаления бронирования
  const handleDeleteBooking = async (bookingId: string | number) => {
    if (!confirm('Czy na pewno chcesz usunąć tę rezerwację?')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/bookings?id=${bookingId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete booking');
      }
      
      // Обновляем список бронирований
      await fetchBookings();
      
      // Если было выбрано удаленное бронирование, закрываем его
      if (selectedBooking && selectedBooking.id === bookingId) {
        setSelectedBooking(null);
        setShowBookingDetails(false);
      }
    } catch (error) {
      console.error('Error deleting booking:', error);
      throw error;
    }
  };
  
  // Рендер вкладки календаря
  const renderCalendarTab = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#f36e21]"></div>
        </div>
      );
    }
    
    return (
      <AdminBookingCalendar
        bookings={bookings}
        selectedDate={selectedDate}
        onDateSelect={setSelectedDate}
        onViewBooking={handleViewBooking}
      />
    );
  };
  
  // Рендер вкладки списка бронирований
  const renderListTab = () => {
    return (
      <AdminBookingManager
        bookings={bookings}
        selectedDate={selectedDate}
        onViewBooking={handleViewBooking}
        onDateSelect={(date) => date ? setSelectedDate(date) : setSelectedDate(format(new Date(), 'yyyy-MM-dd'))}
        isLoading={isLoading}
      />
    );
  };
  
  // Рендер вкладки аналитики
  const renderAnalyticsTab = () => {
    // Данные для текущего и прошлого месяцев
    const currentMonth = new Date();
    const previousMonth = subMonths(currentMonth, 1);
    
    // Статистика по бронированиям
    const currentMonthBookings = bookings.filter(booking => {
      const bookingDate = parseISO(booking.date);
      return bookingDate.getMonth() === currentMonth.getMonth() && 
             bookingDate.getFullYear() === currentMonth.getFullYear();
    });
    
    const previousMonthBookings = bookings.filter(booking => {
      const bookingDate = parseISO(booking.date);
      return bookingDate.getMonth() === previousMonth.getMonth() && 
             bookingDate.getFullYear() === previousMonth.getFullYear();
    });
    
    // Доход за текущий и прошлый месяцы
    const currentMonthRevenue = currentMonthBookings.reduce((sum, booking) => 
      sum + (booking.paymentStatus === 'FULLY_PAID' ? booking.totalAmount : booking.paidAmount), 0);
      
    const previousMonthRevenue = previousMonthBookings.reduce((sum, booking) => 
      sum + (booking.paymentStatus === 'FULLY_PAID' ? booking.totalAmount : booking.paidAmount), 0);
    
    // Статистика по комнатам
    const roomStats = [1, 2, 3, 4].map(roomId => {
      const roomBookings = currentMonthBookings.filter(booking => booking.roomId === roomId);
      return {
        roomId,
        bookingsCount: roomBookings.length,
        revenue: roomBookings.reduce((sum, booking) => 
          sum + (booking.paymentStatus === 'FULLY_PAID' ? booking.totalAmount : booking.paidAmount), 0)
      };
    });
    
    // Статистика по пакетам
    const packageIds = [...new Set(bookings.map(booking => booking.packageId))];
    const packageStats = packageIds.map(packageId => {
      const packageName = bookings.find(b => b.packageId === packageId)?.packageName || packageId;
      const packageBookings = currentMonthBookings.filter(booking => booking.packageId === packageId);
      return {
        packageId,
        packageName,
        bookingsCount: packageBookings.length,
        revenue: packageBookings.reduce((sum, booking) => 
          sum + (booking.paymentStatus === 'FULLY_PAID' ? booking.totalAmount : booking.paidAmount), 0)
      };
    });
    
    return (
      <div className="space-y-8">
        {/* Общая статистика */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-medium text-white mb-2">Rezerwacje w tym miesiącu</h3>
            <p className="text-3xl font-bold text-[#f36e21]">{currentMonthBookings.length}</p>
            <p className="text-sm text-gray-400 mt-1">
              {previousMonthBookings.length > 0 
                ? `${((currentMonthBookings.length / previousMonthBookings.length - 1) * 100).toFixed(1)}% vs. poprzedni miesiąc` 
                : 'Brak danych z poprzedniego miesiąca'}
            </p>
          </div>
          
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-medium text-white mb-2">Przychód w tym miesiącu</h3>
            <p className="text-3xl font-bold text-[#f36e21]">{currentMonthRevenue} PLN</p>
            <p className="text-sm text-gray-400 mt-1">
              {previousMonthRevenue > 0 
                ? `${((currentMonthRevenue / previousMonthRevenue - 1) * 100).toFixed(1)}% vs. poprzedni miesiąc` 
                : 'Brak danych z poprzedniego miesiąca'}
            </p>
          </div>
          
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-medium text-white mb-2">Nieopłacone rezerwacje</h3>
            <p className="text-3xl font-bold text-[#f36e21]">
              {currentMonthBookings.filter(b => b.paymentStatus === 'UNPAID').length}
            </p>
            <p className="text-sm text-gray-400 mt-1">
              {currentMonthBookings.length > 0 
                ? `${((currentMonthBookings.filter(b => b.paymentStatus === 'UNPAID').length / currentMonthBookings.length) * 100).toFixed(1)}% wszystkich rezerwacji` 
                : 'Brak rezerwacji w tym miesiącu'}
            </p>
          </div>
        </div>
        
        {/* Статистика по комнатам */}
        <div>
          <h3 className="text-lg font-medium text-white mb-4">Statystyki pokoi</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {roomStats.map(room => (
              <div key={room.roomId} className="bg-gray-800 rounded-lg p-4">
                <h4 className="text-white font-medium">Pokój {room.roomId}</h4>
                <p className="text-sm text-gray-400 mt-1">Rezerwacje: {room.bookingsCount}</p>
                <p className="text-sm text-gray-400">Przychód: {room.revenue} PLN</p>
              </div>
            ))}
          </div>
        </div>
        
        {/* Статистика по пакетам */}
        <div>
          <h3 className="text-lg font-medium text-white mb-4">Statystyki pakietów</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {packageStats.map(pkg => (
              <div key={pkg.packageId} className="bg-gray-800 rounded-lg p-4">
                <h4 className="text-white font-medium">{pkg.packageName}</h4>
                <p className="text-sm text-gray-400 mt-1">Rezerwacje: {pkg.bookingsCount}</p>
                <p className="text-sm text-gray-400">Przychód: {pkg.revenue} PLN</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };
  
  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-white">Panel administracyjny</h1>
        
        <div className="flex gap-4">
          <Link
            href="/admin/customers"
            className="bg-gray-700 text-white py-2 px-4 rounded-md hover:bg-gray-600 transition-colors flex items-center"
          >
            <svg 
              className="w-5 h-5 mr-2" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2}
                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" 
              />
            </svg>
            Klienci
          </Link>

          <button
            onClick={() => setActiveTab('create')}
            className="bg-[#f36e21] text-white py-2 px-4 rounded-md hover:bg-[#ff7b2e] transition-colors"
          >
            + Dodaj rezerwację
          </button>
        </div>
      </div>
      
      {/* Вкладки */}
      <div className="border-b border-white/10 mb-8">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('calendar')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'calendar' 
                ? 'border-[#f36e21] text-[#f36e21]' 
                : 'border-transparent text-white/70 hover:text-white/90 hover:border-white/30'
            }`}
          >
            Kalendarz
          </button>
          
          <button
            onClick={() => setActiveTab('list')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'list' 
                ? 'border-[#f36e21] text-[#f36e21]' 
                : 'border-transparent text-white/70 hover:text-white/90 hover:border-white/30'
            }`}
          >
            Lista
          </button>
          
          <button
            onClick={() => setActiveTab('analytics')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'analytics' 
                ? 'border-[#f36e21] text-[#f36e21]' 
                : 'border-transparent text-white/70 hover:text-white/90 hover:border-white/30'
            }`}
          >
            Analityka
          </button>
        </nav>
      </div>
      
      {/* Содержимое активной вкладки */}
      {activeTab === 'calendar' && renderCalendarTab()}
      {activeTab === 'list' && renderListTab()}
      {activeTab === 'analytics' && renderAnalyticsTab()}
      {activeTab === 'create' && (
        <AdminCreateBooking 
          onBookingCreate={handleBookingCreate}
        />
      )}
      
      {/* Модальное окно с деталями бронирования */}
      {showBookingDetails && selectedBooking && (
        <AdminBookingDetails
          booking={selectedBooking}
          onClose={() => setShowBookingDetails(false)}
          onPaymentStatusChange={handlePaymentStatusUpdate}
          onAdminCommentChange={handleAdminCommentUpdate}
          onDelete={handleDeleteBooking}
        />
      )}
    </div>
  );
} 