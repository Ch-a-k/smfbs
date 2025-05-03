import React from 'react';
import { Metadata } from 'next';
import UnderDevelopmentMessage from '@/components/booking/UnderDevelopmentMessage';

export const metadata: Metadata = {
  title: 'Функциональность в разработке | Smash & Fun',
  description: 'Эта функциональность находится в разработке. Пожалуйста, используйте основную страницу бронирования.',
};

export default function UnfinishedFeaturePage() {
  return (
    <div className="container mx-auto">
      <UnderDevelopmentMessage 
        redirectUrl="/booking"
        redirectText="страницу бронирования"
      />
    </div>
  );
} 