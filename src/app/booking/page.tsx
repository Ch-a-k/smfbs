import React from 'react';
import { Metadata } from 'next';
import UnderDevelopmentMessage from '@/components/booking/UnderDevelopmentMessage';

export const metadata: Metadata = {
  title: 'Бронирование | Smash & Fun',
  description: 'Забронируйте время для разрушения в Smash & Fun - отличный способ снять стресс и весело провести время.',
};

export default function BookingPage() {
  return (
    <div className="container mx-auto py-12">
      <h1 className="text-3xl font-bold text-center mb-8 text-white">Бронирование</h1>
      
      <UnderDevelopmentMessage 
        redirectUrl="/booking"
        redirectText="страницу бронирования"
        showRedirect={false}
      />
    </div>
  );
} 