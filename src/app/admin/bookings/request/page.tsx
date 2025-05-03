import React from 'react';
import { Metadata } from 'next';
import UnderDevelopmentMessage from '@/components/booking/UnderDevelopmentMessage';

export const metadata: Metadata = {
  title: 'Запрос бронирования | Панель администратора',
  description: 'Страница запроса бронирования для администраторов системы.',
};

export default function AdminBookingRequestPage() {
  return (
    <div className="container mx-auto">
      <h1 className="text-2xl font-bold mb-6">Запрос бронирования</h1>
      
      <UnderDevelopmentMessage 
        redirectUrl="/admin/bookings"
        redirectText="панель управления бронированиями"
      />
    </div>
  );
} 