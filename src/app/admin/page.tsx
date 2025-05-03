'use client';

import Link from 'next/link';

export default function AdminDashboard() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white">Panel administracyjny</h1>
        <p className="text-gray-400 mt-2">Zarządzaj rezerwacjami, klientami i ustawieniami</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Карточка управления бронированиями */}
        <Link
          href="/admin/bookings"
          className="bg-gray-800 rounded-lg p-6 hover:bg-gray-700 transition-colors group"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-[#f36e21]/10 rounded-lg">
              <svg 
                className="w-8 h-8 text-[#f36e21]" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" 
                />
              </svg>
            </div>
            <div className="bg-gray-700/50 rounded-full p-2 group-hover:bg-[#f36e21]/20 transition-colors">
              <svg 
                className="w-5 h-5 text-gray-400 group-hover:text-[#f36e21]" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M9 5l7 7-7 7" 
                />
              </svg>
            </div>
          </div>
          
          <h2 className="text-xl font-semibold text-white mb-2">Rezerwacje</h2>
          <p className="text-gray-400">Zarządzaj rezerwacjami, sprawdź dostępność i aktualizuj statusy płatności</p>
          
          <div className="mt-4 flex items-center text-[#f36e21]">
            <span className="text-sm font-medium">Przejdź do rezerwacji</span>
            <svg 
              className="w-4 h-4 ml-1" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M14 5l7 7m0 0l-7 7m7-7H3" 
              />
            </svg>
          </div>
        </Link>
        
        {/* Карточка управления клиентами */}
        <Link
          href="/admin/customers"
          className="bg-gray-800 rounded-lg p-6 hover:bg-gray-700 transition-colors group"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-[#f36e21]/10 rounded-lg">
              <svg 
                className="w-8 h-8 text-[#f36e21]" 
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
            </div>
            <div className="bg-gray-700/50 rounded-full p-2 group-hover:bg-[#f36e21]/20 transition-colors">
              <svg 
                className="w-5 h-5 text-gray-400 group-hover:text-[#f36e21]" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M9 5l7 7-7 7" 
                />
              </svg>
            </div>
          </div>
          
          <h2 className="text-xl font-semibold text-white mb-2">Klienci</h2>
          <p className="text-gray-400">Przeglądaj dane klientów, ich historię rezerwacji i statystyki</p>
          
          <div className="mt-4 flex items-center text-[#f36e21]">
            <span className="text-sm font-medium">Przejdź do klientów</span>
            <svg 
              className="w-4 h-4 ml-1" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M14 5l7 7m0 0l-7 7m7-7H3" 
              />
            </svg>
          </div>
        </Link>
        
        {/* Карточка настроек */}
        <Link
          href="/admin/settings"
          className="bg-gray-800 rounded-lg p-6 hover:bg-gray-700 transition-colors group"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-[#f36e21]/10 rounded-lg">
              <svg 
                className="w-8 h-8 text-[#f36e21]" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2}
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" 
                />
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" 
                />
              </svg>
            </div>
            <div className="bg-gray-700/50 rounded-full p-2 group-hover:bg-[#f36e21]/20 transition-colors">
              <svg 
                className="w-5 h-5 text-gray-400 group-hover:text-[#f36e21]" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M9 5l7 7-7 7" 
                />
              </svg>
            </div>
          </div>
          
          <h2 className="text-xl font-semibold text-white mb-2">Ustawienia</h2>
          <p className="text-gray-400">Zarządzaj pakietami, pokojami, kodami promocyjnymi i innymi ustawieniami</p>
          
          <div className="mt-4 flex items-center text-[#f36e21]">
            <span className="text-sm font-medium">Przejdź do ustawień</span>
            <svg 
              className="w-4 h-4 ml-1" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M14 5l7 7m0 0l-7 7m7-7H3" 
              />
            </svg>
          </div>
        </Link>
      </div>
      
      <div className="mt-10 bg-gray-800 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Szybkie akcje</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/admin/bookings?tab=create"
            className="bg-gray-700 rounded-lg p-4 hover:bg-gray-600 transition-colors flex items-center"
          >
            <div className="p-2 bg-[#f36e21]/10 rounded-lg mr-4">
              <svg 
                className="w-6 h-6 text-[#f36e21]" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2}
                  d="M12 4v16m8-8H4" 
                />
              </svg>
            </div>
            <span className="text-white">Dodaj nową rezerwację</span>
          </Link>
          
          <Link
            href="/admin/bookings?tab=analytics"
            className="bg-gray-700 rounded-lg p-4 hover:bg-gray-600 transition-colors flex items-center"
          >
            <div className="p-2 bg-[#f36e21]/10 rounded-lg mr-4">
              <svg 
                className="w-6 h-6 text-[#f36e21]" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2}
                  d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" 
                />
              </svg>
            </div>
            <span className="text-white">Zobacz statystyki</span>
          </Link>
          
          <Link
            href="/"
            className="bg-gray-700 rounded-lg p-4 hover:bg-gray-600 transition-colors flex items-center"
          >
            <div className="p-2 bg-[#f36e21]/10 rounded-lg mr-4">
              <svg 
                className="w-6 h-6 text-[#f36e21]" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2}
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" 
                />
              </svg>
            </div>
            <span className="text-white">Wróć do strony głównej</span>
          </Link>
        </div>
      </div>
    </div>
  );
} 