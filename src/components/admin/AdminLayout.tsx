'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { CalendarDays, ListOrdered, Users, Settings, Package, BarChart3, Tag, LogOut } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

// Icons
import { FaCalendarAlt, FaList, FaChartBar, FaPlus, FaUsers, FaSignOutAlt } from 'react-icons/fa';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, isLoading, logout, user } = useAuth();
  
  // Перенаправляем на страницу входа, если пользователь не аутентифицирован
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);
  
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };
  
  const menuItems = [
    { name: 'Kalendarz', icon: <FaCalendarAlt />, path: '/admin/bookings', tab: 'calendar' },
    { name: 'Lista', icon: <FaList />, path: '/admin/bookings', tab: 'list' },
    { name: 'Analityka', icon: <FaChartBar />, path: '/admin/bookings', tab: 'analytics' },
    { name: 'Rezerwacje', icon: <FaPlus />, path: '/admin/bookings', tab: 'create' },
    { name: 'Klienci', icon: <FaUsers />, path: '/admin/customers' },
  ];
  
  // Get current active tab from URL query
  const isActive = (item: { path: string; tab?: string }) => {
    if (item.tab) {
      return pathname === item.path && new URLSearchParams(window.location.search).get('tab') === item.tab;
    }
    return pathname === item.path;
  };
  
  const handleLogout = async () => {
    await logout();
  };
  
  // Если идет загрузка статуса аутентификации, показываем индикатор загрузки
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#f36e21] mx-auto mb-4"></div>
          <h2 className="text-xl text-white">Ładowanie...</h2>
        </div>
      </div>
    );
  }
  
  // Если пользователь не аутентифицирован, страница будет перенаправлена в useEffect
  if (!isAuthenticated) {
    return null;
  }
  
  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar for desktop */}
      <div className="hidden md:flex md:flex-shrink-0">
        <div className="flex flex-col w-64 bg-black">
          <div className="flex flex-col flex-grow pt-5 pb-4 overflow-y-auto">
            <div className="flex items-center flex-shrink-0 px-4">
              <span className="text-white text-xl font-semibold">S&F Admin Panel</span>
            </div>
            <div className="mt-5 flex-grow flex flex-col">
              <nav className="flex-1 px-2 space-y-1">
                {menuItems.map((item, index) => {
                  let url = item.path;
                  if (item.tab) {
                    url = `${item.path}?tab=${item.tab}`;
                  }

                  return (
                    <Link
                      key={index}
                      href={url}
                      className={`${
                        isActive(item)
                          ? 'bg-gray-800 text-white'
                          : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                      } group flex items-center px-2 py-2 text-sm font-medium rounded-md`}
                    >
                      <span className="mr-3 h-6 w-6 flex items-center justify-center">
                        {item.icon}
                      </span>
                      {item.name}
                    </Link>
                  );
                })}
                <Link
                  href="/admin/logout"
                  className="text-gray-300 hover:bg-gray-700 hover:text-white group flex items-center px-2 py-2 text-sm font-medium rounded-md mt-8"
                >
                  <span className="mr-3 h-6 w-6 flex items-center justify-center">
                    <FaSignOutAlt />
                  </span>
                  Wyloguj
                </Link>
              </nav>
            </div>
            {user && (
              <div className="flex-shrink-0 flex border-t border-gray-700 p-4">
                <div className="flex items-center">
                  <div className="ml-3">
                    <p className="text-sm font-medium text-white">{user.name}</p>
                    <p className="text-xs font-medium text-gray-400">{user.role}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className="md:hidden fixed top-0 inset-x-0 z-50 bg-black">
        <div className="px-4 py-3 flex items-center justify-between">
          <div>
            <span className="text-white text-lg font-semibold">S&F Admin Panel</span>
          </div>
          <div>
            <button
              type="button"
              className="text-gray-200 focus:outline-none"
              onClick={toggleMobileMenu}
            >
              <span className="sr-only">Open main menu</span>
              <svg
                className="h-6 w-6"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d={isMobileMenuOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'}
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile menu content */}
        {isMobileMenuOpen && (
          <div className="px-2 pt-2 pb-3 space-y-1">
            {menuItems.map((item, index) => {
              let url = item.path;
              if (item.tab) {
                url = `${item.path}?tab=${item.tab}`;
              }

              return (
                <Link
                  key={index}
                  href={url}
                  className={`${
                    isActive(item)
                      ? 'bg-gray-800 text-white'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  } block px-3 py-2 rounded-md text-base font-medium flex items-center`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <span className="mr-3">{item.icon}</span>
                  {item.name}
                </Link>
              );
            })}
            <Link
              href="/admin/logout"
              className="text-gray-300 hover:bg-gray-700 hover:text-white block px-3 py-2 rounded-md text-base font-medium flex items-center mt-4"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <span className="mr-3"><FaSignOutAlt /></span>
              Wyloguj
            </Link>
          </div>
        )}
      </div>

      {/* Main content */}
      <div className="flex flex-col w-0 flex-1 bg-gray-100">
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <div className="py-6 md:py-12 px-4 sm:px-6 md:px-8">{children}</div>
        </main>
      </div>
    </div>
  );
} 