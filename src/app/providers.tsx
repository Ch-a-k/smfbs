'use client';

import React from 'react';
import { AuthProvider } from '@/context/AuthContext';
import { I18nProvider } from '@/i18n/I18nContext';

interface ProvidersProps {
  children: React.ReactNode;
}

export default function Providers({ children }: ProvidersProps) {
  return (
    <AuthProvider>
      <I18nProvider>
        {children}
      </I18nProvider>
    </AuthProvider>
  );
} 