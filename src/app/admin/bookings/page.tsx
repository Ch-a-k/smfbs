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
import { useBookings, useBookingMutations } from '@/app/api/hooks';

// Типы для вкладок администратора
type AdminTab = 'calendar' | 'list' | 'analytics' | 'create';

export default function AdminBookingsPage() {
  const [activeTab, setActiveTab] = useState<AdminTab>('calendar');
  const { bookings, isLoading, error, refetch } = useBookings();
  const { createBooking, updatePaymentStatus, updateAdminComment, deleteBooking } = useBookingMutations();
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showBookingDetails, setShowBookingDetails] = useState(false);
  
  // Обработчик просмотра деталей бронирования
  const handleViewBooking = (booking: Booking) => {
    setSelectedBooking(booking);
    setShowBookingDetails(true);
  };
  
  // Обработчик создания нового бронирования
  const handleBookingCreate = async (bookingData: BookingFormData, paymentStatus: PaymentStatus) => {
    try {
      console.log('Создание бронирования с данными:', bookingData, 'Статус оплаты:', paymentStatus);
      
      await createBooking(bookingData, paymentStatus);
      
      // Обновляем список бронирований
      await refetch();
      
      // Возвращаемся к календарю
      setActiveTab('calendar');
      
      // Сообщение об успешном создании
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
      await updatePaymentStatus(bookingId, newStatus);
      
      // Обновляем список бронирований
      await refetch();
      
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
      await updateAdminComment(bookingId, comment);
      
      // Обновляем список бронирований
      await refetch();
      
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
      await deleteBooking(bookingId);
      
      // Обновляем список бронирований
      await refetch();
      
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
  
  // Передача пропсов в компоненты табов
  const renderTabContent = () => {
    switch (activeTab) {
      case 'calendar':
        console.log('Отображение календаря с бронированиями:', { 
          bookingsCount: bookings.length,
          selectedDate,
          hasBookingsForDate: bookings.filter(b => b.date === selectedDate || b.bookingDate === selectedDate).length
        });
        return (
          <AdminBookingCalendar
            bookings={bookings}
            selectedDate={selectedDate}
            onDateSelect={handleDateSelect}
            onViewBooking={handleViewBooking}
          />
        );
      case 'list':
        return (
          <AdminBookingManager
            bookings={bookings}
            selectedDate={selectedDate}
            onViewBooking={handleViewBooking}
            onDateSelect={(date) => date ? setSelectedDate(date) : setSelectedDate(format(new Date(), 'yyyy-MM-dd'))}
            isLoading={isLoading}
          />
        );
      case 'analytics':
        return renderAnalyticsTab();
      default:
        return null;
    }
  };

  // Обработчик изменения выбранной даты в календаре
  const handleDateSelect = (date: string) => {
    console.log('Выбрана новая дата в календаре:', date);
    console.log('Бронирования на выбранную дату:', bookings.filter(b => 
      b.date === date || b.bookingDate === date
    ));
    setSelectedDate(date);
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
      sum + (booking.paymentStatus === 'FULLY_PAID' ? booking.totalAmount || 0 : booking.paidAmount || 0), 0);
      
    const previousMonthRevenue = previousMonthBookings.reduce((sum, booking) => 
      sum + (booking.paymentStatus === 'FULLY_PAID' ? booking.totalAmount || 0 : booking.paidAmount || 0), 0);
    
    // Статистика по комнатам
    const roomStats = [1, 2, 3, 4].map(roomId => {
      const roomBookings = currentMonthBookings.filter(booking => booking.roomId === roomId);
      return {
        roomId,
        bookingsCount: roomBookings.length,
        revenue: roomBookings.reduce((sum, booking) => 
          sum + (booking.paymentStatus === 'FULLY_PAID' ? booking.totalAmount || 0 : booking.paidAmount || 0), 0),
        occupancyRate: roomBookings.length > 0 ? (roomBookings.length / 30 * 100).toFixed(1) + '%' : '0%'
      };
    }).sort((a, b) => b.bookingsCount - a.bookingsCount);
    
    // Статистика по пакетам
    const packageIds = [...new Set(bookings.filter(booking => booking.packageId !== undefined).map(booking => booking.packageId))];
    const packageStats = packageIds
      .map(packageId => {
        const packageName = bookings.find(b => b.packageId === packageId)?.packageName || `Package ${packageId}`;
        const packageBookings = currentMonthBookings.filter(booking => booking.packageId === packageId);
        return {
          packageId,
          packageName,
          bookingsCount: packageBookings.length,
          revenue: packageBookings.reduce((sum, booking) => 
            sum + (booking.paymentStatus === 'FULLY_PAID' ? booking.totalAmount || 0 : booking.paidAmount || 0), 0),
          averagePrice: packageBookings.length > 0 
            ? (packageBookings.reduce((sum, booking) => sum + (booking.totalAmount || 0), 0) / packageBookings.length).toFixed(0)
            : 0
        };
      })
      .filter(pkg => pkg.bookingsCount > 0)
      .sort((a, b) => b.bookingsCount - a.bookingsCount);
    
    // Статистика по дням недели
    const daysOfWeek = ['Niedziela', 'Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek', 'Sobota'];
    const dayStats = daysOfWeek.map((dayName, index) => {
      const dayBookings = bookings.filter(booking => {
        try {
          const date = parseISO(booking.date);
          return date.getDay() === index;
        } catch (e) {
          return false;
        }
      });
      
      return {
        day: dayName,
        bookingsCount: dayBookings.length,
        revenue: dayBookings.reduce((sum, booking) => 
          sum + (booking.paymentStatus === 'FULLY_PAID' ? booking.totalAmount || 0 : booking.paidAmount || 0), 0)
      };
    }).sort((a, b) => b.bookingsCount - a.bookingsCount);
    
    // Статистика по статусам оплаты
    const paymentStatusStats = [
      {
        status: 'Opłacone w całości',
        count: bookings.filter(b => b.paymentStatus === 'FULLY_PAID').length,
        percentage: (bookings.filter(b => b.paymentStatus === 'FULLY_PAID').length / (bookings.length || 1) * 100).toFixed(1) + '%'
      },
      {
        status: 'Zaliczka',
        count: bookings.filter(b => b.paymentStatus === 'DEPOSIT_PAID').length,
        percentage: (bookings.filter(b => b.paymentStatus === 'DEPOSIT_PAID').length / (bookings.length || 1) * 100).toFixed(1) + '%'
      },
      {
        status: 'Nieopłacone',
        count: bookings.filter(b => b.paymentStatus === 'UNPAID').length,
        percentage: (bookings.filter(b => b.paymentStatus === 'UNPAID').length / (bookings.length || 1) * 100).toFixed(1) + '%'
      }
    ];
    
    return (
      <div className="space-y-8">
        {/* Общая статистика */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
          
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-medium text-white mb-2">Średnia wartość rezerwacji</h3>
            <p className="text-3xl font-bold text-[#f36e21]">
              {currentMonthBookings.length > 0 
                ? (currentMonthRevenue / currentMonthBookings.length).toFixed(0) 
                : 0} PLN
            </p>
            <p className="text-sm text-gray-400 mt-1">
              {previousMonthBookings.length > 0 && previousMonthRevenue > 0
                ? `${(((currentMonthRevenue / currentMonthBookings.length) / (previousMonthRevenue / previousMonthBookings.length) - 1) * 100).toFixed(1)}% vs. poprzedni miesiąc`
                : 'Brak danych z poprzedniego miesiąca'}
            </p>
          </div>
        </div>
        
        {/* Статистика по статусам оплаты */}
        <div>
          <h3 className="text-lg font-medium text-white mb-4">Statystyki płatności</h3>
          <div className="bg-gray-800 rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-700">
              <thead className="bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Liczba rezerwacji</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Procent</th>
                </tr>
              </thead>
              <tbody className="bg-gray-800 divide-y divide-gray-700">
                {paymentStatusStats.map((stat, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">{stat.status}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">{stat.count}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">{stat.percentage}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Статистика по комнатам */}
        <div>
          <h3 className="text-lg font-medium text-white mb-4">Statystyki pokoi</h3>
          <div className="bg-gray-800 rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-700">
              <thead className="bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Pokój</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Liczba rezerwacji</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Przychód</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Poziom obłożenia</th>
                </tr>
              </thead>
              <tbody className="bg-gray-800 divide-y divide-gray-700">
                {roomStats.map(room => (
                  <tr key={room.roomId}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">Pokój {room.roomId}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">{room.bookingsCount}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">{room.revenue} PLN</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">{room.occupancyRate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Статистика по пакетам */}
        <div>
          <h3 className="text-lg font-medium text-white mb-4">Najpopularniejsze pakiety</h3>
          <div className="bg-gray-800 rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-700">
              <thead className="bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Pakiet</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Liczba rezerwacji</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Przychód</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Średnia cena</th>
                </tr>
              </thead>
              <tbody className="bg-gray-800 divide-y divide-gray-700">
                {packageStats.map(pkg => (
                  <tr key={pkg.packageId}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">{pkg.packageName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">{pkg.bookingsCount}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">{pkg.revenue} PLN</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">{pkg.averagePrice} PLN</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Статистика по дням недели */}
        <div>
          <h3 className="text-lg font-medium text-white mb-4">Najpopularniejsze dni tygodnia</h3>
          <div className="bg-gray-800 rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-700">
              <thead className="bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Dzień tygodnia</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Liczba rezerwacji</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Przychód</th>
                </tr>
              </thead>
              <tbody className="bg-gray-800 divide-y divide-gray-700">
                {dayStats.map((day, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">{day.day}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">{day.bookingsCount}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">{day.revenue} PLN</td>
                  </tr>
                ))}
              </tbody>
            </table>
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
      {renderTabContent()}
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