'use client';

import { useState, useMemo } from 'react';
import { Booking, PaymentStatus } from '@/types/booking';
import { format, parseISO } from 'date-fns';
import { pl } from 'date-fns/locale';

interface AdminBookingListProps {
  bookings: Booking[];
  selectedDate?: string;
  onViewBooking: (booking: Booking) => void;
  filterStatus?: PaymentStatus | 'ALL';
  searchTerm?: string;
}

export default function AdminBookingList({
  bookings,
  selectedDate,
  onViewBooking,
  filterStatus = 'ALL',
  searchTerm = ''
}: AdminBookingListProps) {
  const [sortField, setSortField] = useState<keyof Booking>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Функция для сортировки бронирований
  const handleSort = (field: keyof Booking) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Функция для отображения иконки сортировки
  const getSortIcon = (field: keyof Booking) => {
    if (sortField !== field) return null;
    
    return (
      <span className="ml-1">
        {sortDirection === 'asc' ? '↑' : '↓'}
      </span>
    );
  };

  // Статус оплаты в формате для отображения
  const getPaymentStatusText = (status: PaymentStatus): string => {
    switch (status) {
      case 'UNPAID':
        return 'Nieopłacony';
      case 'DEPOSIT_PAID':
        return 'Zaliczka';
      case 'FULLY_PAID':
        return 'Opłacony';
      default:
        return status;
    }
  };

  // Цвет для статуса оплаты
  const getPaymentStatusColor = (status: PaymentStatus): string => {
    switch (status) {
      case 'UNPAID':
        return 'bg-red-900 text-red-200';
      case 'DEPOSIT_PAID':
        return 'bg-yellow-900 text-yellow-200';
      case 'FULLY_PAID':
        return 'bg-green-900 text-green-200';
      default:
        return 'bg-gray-700 text-gray-200';
    }
  };

  // Только сортировка бронирований (фильтрация уже выполнена в родительском компоненте)
  const sortedBookings = useMemo(() => {
    return [...bookings].sort((a, b) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];
      
      // Обработка случаев, когда значение может быть undefined
      if (aValue === undefined || aValue === null) aValue = '';
      if (bValue === undefined || bValue === null) bValue = '';
      
      // Преобразуем значения для сравнения, если необходимо
      if (sortField === 'date') {
        try {
          aValue = new Date(a.date || '').getTime();
          bValue = new Date(b.date || '').getTime();
        } catch (e) {
          aValue = 0;
          bValue = 0;
        }
      } else if (typeof aValue === 'string' && typeof bValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }
      
      // Сортировка
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [bookings, sortField, sortDirection]);

  if (bookings.length === 0) {
    return (
      <div className="bg-gray-800 rounded-lg p-8 text-center">
        <p className="text-gray-400">Brak rezerwacji</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden">
      <div className="shadow overflow-x-auto border-b border-gray-700 rounded-lg">
        <table className="min-w-full divide-y divide-gray-700">
          <thead className="bg-gray-800">
            <tr>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('date')}
              >
                <div className="flex items-center">
                  Data
                  {getSortIcon('date')}
                </div>
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('startTime')}
              >
                <div className="flex items-center">
                  Godzina
                  {getSortIcon('startTime')}
                </div>
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('name')}
              >
                <div className="flex items-center">
                  Klient
                  {getSortIcon('name')}
                </div>
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('packageName')}
              >
                <div className="flex items-center">
                  Pakiet
                  {getSortIcon('packageName')}
                </div>
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('roomId')}
              >
                <div className="flex items-center">
                  Pokój
                  {getSortIcon('roomId')}
                </div>
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('totalAmount')}
              >
                <div className="flex items-center">
                  Kwota
                  {getSortIcon('totalAmount')}
                </div>
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('paymentStatus')}
              >
                <div className="flex items-center">
                  Status
                  {getSortIcon('paymentStatus')}
                </div>
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                Akcje
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {sortedBookings.map(booking => (
              <tr 
                key={booking.id.toString()}
                className="hover:bg-gray-700/50 transition-colors cursor-pointer"
                onClick={() => onViewBooking(booking)}
              >
                <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                  {booking.date && format(parseISO(booking.date), 'd MMM yyyy', { locale: pl })}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                  {booking.startTime} - {booking.endTime}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                  <div>{booking.name}</div>
                  <div className="text-gray-400 text-xs">{booking.email}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                  {booking.packageName}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                  {booking.roomId}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                  {booking.totalAmount !== undefined ? `${booking.totalAmount} PLN` : '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span className={`px-2 py-1 rounded-full text-xs ${getPaymentStatusColor(booking.paymentStatus)}`}>
                    {getPaymentStatusText(booking.paymentStatus)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button 
                    className="text-[#f36e21] hover:text-[#ff7b2e] transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      onViewBooking(booking);
                    }}
                  >
                    Szczegóły
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {sortedBookings.length === 0 && (
        <div className="text-center py-8 text-gray-400">
          {searchTerm 
            ? 'Brak rezerwacji pasujących do wyszukiwania'
            : filterStatus !== 'ALL'
              ? `Brak rezerwacji ze statusem "${getPaymentStatusText(filterStatus as PaymentStatus)}"`
              : selectedDate
                ? `Brak rezerwacji na dzień ${selectedDate ? format(parseISO(selectedDate), 'd MMMM yyyy', { locale: pl }) : ''}`
                : 'Brak rezerwacji'
          }
        </div>
      )}
    </div>
  );
} 