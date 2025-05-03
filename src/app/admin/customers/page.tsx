'use client';

import { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import { pl } from 'date-fns/locale';
import { Customer } from '@/app/api/customers/route';
import { Booking } from '@/types/booking';
import Link from 'next/link';

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  
  // Загрузка клиентов
  useEffect(() => {
    fetchCustomers();
  }, []);
  
  // Эффект для фильтрации клиентов при изменении поискового запроса
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredCustomers(customers);
    } else {
      const term = searchTerm.toLowerCase();
      setFilteredCustomers(
        customers.filter(customer => 
          customer.name.toLowerCase().includes(term) ||
          customer.email.toLowerCase().includes(term) ||
          customer.phone.includes(searchTerm)
        )
      );
    }
  }, [searchTerm, customers]);
  
  // Функция загрузки клиентов
  const fetchCustomers = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/customers');
      if (!response.ok) {
        throw new Error('Failed to fetch customers');
      }
      const data: Customer[] = await response.json();
      setCustomers(data);
      setFilteredCustomers(data);
    } catch (error) {
      console.error('Error loading customers:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Обработчик выбора клиента
  const handleSelectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
  };
  
  // Обработчик закрытия деталей клиента
  const handleCloseDetails = () => {
    setSelectedCustomer(null);
  };
  
  // Функция получения статуса оплаты
  const getPaymentStatusText = (status: string) => {
    switch (status) {
      case 'FULLY_PAID':
        return 'Opłacone w całości';
      case 'DEPOSIT_PAID':
        return 'Wpłacony zadatek';
      case 'UNPAID':
        return 'Nieopłacone';
      default:
        return status;
    }
  };
  
  // Функция получения класса для статуса оплаты
  const getPaymentStatusClass = (status: string) => {
    switch (status) {
      case 'FULLY_PAID':
        return 'bg-green-500/20 text-green-300';
      case 'DEPOSIT_PAID':
        return 'bg-yellow-500/20 text-yellow-300';
      case 'UNPAID':
        return 'bg-red-500/20 text-red-300';
      default:
        return 'bg-gray-500/20 text-gray-300';
    }
  };
  
  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-white">Klienci</h1>
        
        <Link
          href="/admin/bookings"
          className="bg-gray-700 text-white py-2 px-4 rounded-md hover:bg-gray-600 transition-colors"
        >
          Powrót do rezerwacji
        </Link>
      </div>
      
      {/* Поиск клиентов */}
      <div className="mb-8">
        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Szukaj klientów (imię, email, telefon)..."
            className="w-full bg-gray-800 text-white border border-gray-700 rounded-md py-3 px-4 pl-12 focus:outline-none focus:ring-2 focus:ring-[#f36e21]"
          />
          <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
            <svg 
              className="w-5 h-5 text-gray-400" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
              />
            </svg>
          </div>
        </div>
      </div>
      
      {/* Список клиентов */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="col-span-1 lg:col-span-1 bg-gray-800 rounded-lg p-6">
          <h2 className="text-lg font-medium text-white mb-4">Lista klientów</h2>
          
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#f36e21]"></div>
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              {searchTerm ? 'Nie znaleziono klientów' : 'Brak klientów'}
            </div>
          ) : (
            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
              {filteredCustomers.map(customer => (
                <div 
                  key={customer.email}
                  className={`bg-gray-700 rounded-lg p-4 hover:bg-gray-600 transition-colors cursor-pointer ${
                    selectedCustomer?.email === customer.email ? 'border-2 border-[#f36e21]' : ''
                  }`}
                  onClick={() => handleSelectCustomer(customer)}
                >
                  <h3 className="font-medium text-white">{customer.name}</h3>
                  <p className="text-sm text-gray-300">{customer.email}</p>
                  <p className="text-sm text-gray-300">{customer.phone}</p>
                  
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-600">
                    <span className="text-sm text-gray-400">
                      {customer.totalBookings} {customer.totalBookings === 1 ? 'rezerwacja' : 'rezerwacje'}
                    </span>
                    <span className="text-[#f36e21] font-medium">
                      {customer.totalSpent} PLN
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Детали клиента и история бронирований */}
        <div className="col-span-1 lg:col-span-2 bg-gray-800 rounded-lg p-6">
          {selectedCustomer ? (
            <div>
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-xl font-bold text-white">{selectedCustomer.name}</h2>
                  <p className="text-gray-300">{selectedCustomer.email}</p>
                  <p className="text-gray-300">{selectedCustomer.phone}</p>
                </div>
                
                <button
                  onClick={handleCloseDetails}
                  className="p-2 rounded-full hover:bg-gray-700 transition-colors text-gray-400 hover:text-white"
                >
                  &times;
                </button>
              </div>
              
              <div className="flex flex-wrap gap-4 mb-6">
                <div className="bg-gray-700 rounded-lg p-4 flex-1">
                  <h3 className="text-sm font-medium text-gray-400 mb-1">Liczba rezerwacji</h3>
                  <p className="text-2xl font-bold text-white">{selectedCustomer.totalBookings}</p>
                </div>
                
                <div className="bg-gray-700 rounded-lg p-4 flex-1">
                  <h3 className="text-sm font-medium text-gray-400 mb-1">Wydane pieniądze</h3>
                  <p className="text-2xl font-bold text-[#f36e21]">{selectedCustomer.totalSpent} PLN</p>
                </div>
                
                <div className="bg-gray-700 rounded-lg p-4 flex-1">
                  <h3 className="text-sm font-medium text-gray-400 mb-1">Pierwszy raz</h3>
                  <p className="text-xl font-medium text-white">
                    {format(parseISO(selectedCustomer.firstBookingDate), 'd MMM yyyy', { locale: pl })}
                  </p>
                </div>
              </div>
              
              <h3 className="text-lg font-medium text-white mb-4">Historia rezerwacji</h3>
              
              {selectedCustomer.bookings.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  Brak historii rezerwacji
                </div>
              ) : (
                <div className="space-y-4">
                  {selectedCustomer.bookings
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .map((booking: Booking) => (
                      <div 
                        key={booking.id} 
                        className="bg-gray-700 rounded-lg p-4"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-white font-medium">
                                {format(parseISO(booking.date), 'd MMMM yyyy', { locale: pl })}
                              </span>
                              <span className="text-sm text-gray-300">
                                {booking.startTime} - {booking.endTime}
                              </span>
                            </div>
                            
                            <div className="flex items-center mt-2 space-x-2">
                              <span className="text-sm text-gray-300">
                                {booking.packageName}
                              </span>
                              <span className="text-xs px-2 py-0.5 rounded-full bg-gray-600 text-gray-300">
                                Pokój {booking.roomId}
                              </span>
                              <span className="text-xs px-2 py-0.5 rounded-full bg-gray-600 text-gray-300">
                                {booking.numberOfPeople} {booking.numberOfPeople === 1 ? 'osoba' : 'osoby'}
                              </span>
                            </div>
                          </div>
                          
                          <div className="flex flex-col items-end">
                            <span className="text-lg font-bold text-white">
                              {booking.totalAmount} PLN
                            </span>
                            <span className={`text-xs px-2 py-0.5 rounded-full mt-1 ${
                              getPaymentStatusClass(booking.paymentStatus)
                            }`}>
                              {getPaymentStatusText(booking.paymentStatus)}
                            </span>
                          </div>
                        </div>
                        
                        {(booking.comment || booking.adminComment) && (
                          <div className="mt-3 pt-3 border-t border-gray-600 space-y-2">
                            {booking.comment && (
                              <p className="text-sm text-gray-300">
                                <span className="text-gray-400">Komentarz: </span>
                                {booking.comment}
                              </p>
                            )}
                            
                            {booking.adminComment && (
                              <p className="text-sm text-yellow-300">
                                <span className="text-yellow-400">Admin: </span>
                                {booking.adminComment}
                              </p>
                            )}
                          </div>
                        )}
                        
                        <div className="mt-3 flex justify-end">
                          <Link
                            href={`/admin/bookings?date=${booking.date}`}
                            className="text-sm text-[#f36e21] hover:text-[#ff7b2e] transition-colors"
                          >
                            Przejdź do rezerwacji →
                          </Link>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center py-20">
              <svg 
                className="w-20 h-20 text-gray-500 mb-4" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={1.5} 
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" 
                />
              </svg>
              <h3 className="text-xl font-medium text-white mb-2">Wybierz klienta</h3>
              <p className="text-gray-400 max-w-md">
                Wybierz klienta z listy po lewej stronie, aby wyświetlić szczegółową historię rezerwacji i dane klienta.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 