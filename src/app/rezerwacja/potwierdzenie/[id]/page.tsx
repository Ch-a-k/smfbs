'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Booking } from '@/types/booking';

export default function BookingConfirmationPage() {
  const params = useParams();
  const bookingId = params.id as string;
  
  const [booking, setBooking] = useState<Booking | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    // Загружаем данные о бронировании
    fetch(`/api/bookings?id=${bookingId}`)
      .then(response => {
        if (!response.ok) {
          throw new Error('Nie udało się pobrać danych rezerwacji');
        }
        return response.json();
      })
      .then(data => {
        setBooking(data);
        setIsLoading(false);
      })
      .catch(err => {
        console.error('Error fetching booking:', err);
        setError(err.message);
        setIsLoading(false);
      });
  }, [bookingId]);
  
  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-[#f36e21]"></div>
        </div>
      </div>
    );
  }
  
  if (error || !booking) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="bg-[#1a1718] rounded-lg p-8 shadow-lg text-center">
          <svg className="w-20 h-20 text-red-500 mx-auto mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h1 className="text-3xl font-bold text-white mb-4">Wystąpił błąd</h1>
          <p className="text-white/70 mb-6">{error || 'Nie udało się znaleźć rezerwacji'}</p>
          <Link href="/rezerwacja" className="bg-[#f36e21] text-white font-bold py-3 px-6 rounded-md hover:bg-[#ff7b2e] transition-colors inline-block">
            Wróć do rezerwacji
          </Link>
        </div>
      </div>
    );
  }
  
  // Определяем статус оплаты
  const paymentStatusText = booking.paymentStatus === 'FULLY_PAID' 
    ? 'Opłacone' 
    : booking.paymentStatus === 'DEPOSIT_PAID' 
      ? 'Wpłacony zadatek' 
      : 'Oczekuje na płatność';
  
  // Определяем класс для статуса
  const paymentStatusClass = booking.paymentStatus === 'FULLY_PAID' 
    ? 'bg-green-500' 
    : booking.paymentStatus === 'DEPOSIT_PAID' 
      ? 'bg-yellow-500' 
      : 'bg-red-500';
  
  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="bg-[#1a1718] rounded-lg p-8 shadow-lg">
        <div className="flex items-center justify-center mb-8">
          <svg className="w-16 h-16 text-green-500 mr-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <h1 className="text-3xl font-bold text-white">Rezerwacja potwierdzona</h1>
        </div>
        
        <div className="bg-[#231f20] border border-white/10 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-white mb-4">Szczegóły rezerwacji</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="mb-4">
                <h3 className="text-white/70 text-sm mb-1">Pakiet</h3>
                <p className="text-white font-bold">{booking.packageName}</p>
              </div>
              
              <div className="mb-4">
                <h3 className="text-white/70 text-sm mb-1">Data</h3>
                <p className="text-white font-bold">{booking.date}</p>
              </div>
              
              <div className="mb-4">
                <h3 className="text-white/70 text-sm mb-1">Godzina</h3>
                <p className="text-white font-bold">{booking.startTime} - {booking.endTime}</p>
              </div>
            </div>
            
            <div>
              <div className="mb-4">
                <h3 className="text-white/70 text-sm mb-1">Numer rezerwacji</h3>
                <p className="text-white font-bold">{booking.id}</p>
              </div>
              
              <div className="mb-4">
                <h3 className="text-white/70 text-sm mb-1">Status płatności</h3>
                <div className="flex items-center">
                  <span className={`inline-block w-3 h-3 ${paymentStatusClass} rounded-full mr-2`}></span>
                  <span className="text-white font-bold">{paymentStatusText}</span>
                </div>
              </div>
              
              <div>
                <h3 className="text-white/70 text-sm mb-1">Kwota</h3>
                <p className="text-2xl font-bold text-[#f36e21]">{booking.totalAmount} zł</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-[#231f20] border border-white/10 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-white mb-4">Dane kontaktowe</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="mb-4">
                <h3 className="text-white/70 text-sm mb-1">Imię i nazwisko</h3>
                <p className="text-white font-bold">{booking.name}</p>
              </div>
              
              <div className="mb-4">
                <h3 className="text-white/70 text-sm mb-1">Email</h3>
                <p className="text-white font-bold">{booking.email}</p>
              </div>
              
              <div>
                <h3 className="text-white/70 text-sm mb-1">Telefon</h3>
                <p className="text-white font-bold">{booking.phone}</p>
              </div>
            </div>
            
            {booking.comment && (
              <div>
                <h3 className="text-white/70 text-sm mb-1">Komentarz</h3>
                <p className="text-white">{booking.comment}</p>
              </div>
            )}
          </div>
        </div>
        
        {booking.paymentStatus !== 'FULLY_PAID' && (
          <div className="bg-[#231f20] border border-white/10 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-bold text-white mb-4">Dokończ płatność</h2>
            <p className="text-white/70 mb-4">
              Twoja rezerwacja jest ważna, ale nie została jeszcze w pełni opłacona. Możesz dokończyć płatność teraz lub przed wizytą.
            </p>
            <button
              className="bg-[#f36e21] text-white font-bold py-3 px-6 rounded-md hover:bg-[#ff7b2e] transition-colors"
              onClick={() => {
                // Перенаправление на страницу оплаты
                window.location.href = '/api/payments/redirect?bookingId=' + booking.id;
              }}
            >
              Zapłać teraz
            </button>
          </div>
        )}
        
        <div className="text-center">
          <p className="text-white/70 mb-6">
            Potwierdzenie rezerwacji zostało wysłane na adres email {booking.email}.<br />
            W przypadku pytań prosimy o kontakt pod numerem telefonu <span className="text-white font-bold">+48 123 456 789</span>.
          </p>
          
          <Link href="/" className="bg-[#f36e21] text-white font-bold py-3 px-6 rounded-md hover:bg-[#ff7b2e] transition-colors inline-block">
            Powrót do strony głównej
          </Link>
        </div>
      </div>
    </div>
  );
} 