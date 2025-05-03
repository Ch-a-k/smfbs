'use client';

import React from 'react';
import Link from 'next/link';

interface UnderDevelopmentMessageProps {
  redirectUrl?: string;
  redirectText?: string;
  showRedirect?: boolean;
}

export function UnderDevelopmentMessage({
  redirectUrl = '/booking',
  redirectText = 'страницу бронирования',
  showRedirect = true
}: UnderDevelopmentMessageProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 max-w-md mx-auto my-12 text-center bg-[#231f20] rounded-lg shadow-lg border border-[#f36e21]/20">
      <div className="mb-6">
        <svg 
          className="w-16 h-16 text-[#f36e21] mx-auto mb-4" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth="2" 
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
          />
        </svg>
        <h2 className="text-xl font-bold text-white mb-2">
          Функциональность находится в разработке
        </h2>
        <p className="text-white/70 mb-4">
          Эта часть сервиса пока не доступна. Мы работаем над тем, чтобы скоро предоставить вам полноценный доступ.
        </p>
        
        {showRedirect && (
          <>
            <p className="text-white/70 mb-6">
              Для создания новой брони, пожалуйста, используйте {redirectText}.
            </p>
            <Link 
              href={redirectUrl}
              className="px-6 py-3 bg-[#f36e21] text-white rounded-md hover:bg-[#e05e11] transition-colors inline-block"
            >
              Перейти к бронированию
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

export default UnderDevelopmentMessage; 