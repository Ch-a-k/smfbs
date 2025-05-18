'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { 
  LogOut, 
  Calendar, 
  PlusCircle, 
  List, 
  Home, 
  Package, 
  DoorOpen,
  Settings,
  Users,
  LayoutDashboardIcon,
  PercentDiamond
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Toaster } from '@/components/ui/toaster';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isLoading, logout } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const navItems = useMemo(() => [
    {
      name: 'Дашборд',
      href: '/admin/dashboard',
      segment: 'dashboard',
      icon: <LayoutDashboardIcon className="w-5 h-5" />
    },
    {
      name: 'Календарь',
      href: '/admin/calendar',
      segment: 'calendar',
      icon: <Calendar className="w-5 h-5" />
    },
    {
      name: 'Бронирования',
      href: '/admin/bookings',
      segment: 'bookings',
      icon: <Package className="w-5 h-5" />
    },
    {
      name: 'Клиенты',
      href: '/admin/customers',
      segment: 'customers',
      icon: <Users className="w-5 h-5" />
    },
    {
      name: 'Комнаты',
      href: '/admin/rooms',
      segment: 'rooms',
      icon: <DoorOpen className="w-5 h-5" />
    },
    {
      name: 'Пакеты',
      href: '/admin/packages',
      segment: 'packages',
      icon: <Package className="w-5 h-5" />
    },
    {
      name: 'Пользователи',
      href: '/admin/users',
      segment: 'users',
      icon: <Users className="w-5 h-5" />
    },
    {
      name: 'Промокоды',
      href: '/admin/discounts',
      segment: 'discounts',
      icon: <PercentDiamond className="w-5 h-5" />
    }
  ], []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className={cn(
        "bg-card border-r border-border transition-all duration-300 ease-in-out",
        isSidebarOpen ? "w-64" : "w-20"
      )}>
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="h-16 flex items-center justify-between px-4 border-b border-border bg-black">
            <h1 className={cn(
              "font-bold text-white transition-all duration-300",
              isSidebarOpen ? "text-xl" : "text-xs"
            )}>
              {isSidebarOpen ? 'SMASH Admin' : 'SM'}
            </h1>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="text-white hover:text-primary hover:bg-black/50"
            >
              {isSidebarOpen ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-panel-left-close">
                  <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
                  <path d="M9 3v18"/>
                  <path d="m16 15-3-3 3-3"/>
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-panel-left-open">
                  <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
                  <path d="M9 3v18"/>
                  <path d="m14 9 3 3-3 3"/>
                </svg>
              )}
            </Button>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 overflow-y-auto py-4">
            <ul className="space-y-1 px-2">
              {navItems.map((item) => (
                <li key={item.href}>
                  <Link href={item.href}>
                    <Button 
                      variant={pathname === item.href ? 'default' : 'ghost'} 
                      className={cn(
                        "w-full justify-start",
                        pathname === item.href 
                          ? "bg-primary text-white" 
                          : "text-foreground hover:text-primary hover:bg-muted/50",
                        isSidebarOpen ? "" : "justify-center"
                      )}
                    >
                      {item.icon}
                      {isSidebarOpen && <span className="ml-3">{item.name}</span>}
                    </Button>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Sidebar Footer */}
          <div className="p-4 border-t border-border bg-muted">
            <Button 
              variant="outline" 
              className="w-full justify-start text-foreground hover:text-destructive hover:border-destructive"
              onClick={handleLogout}
            >
              <LogOut className="h-5 w-5" />
              {isSidebarOpen && <span className="ml-3">Выйти</span>}
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-black border-b border-border flex items-center justify-between px-6">
          <h1 className="text-xl font-semibold text-white">Панель администратора</h1>
          {/* <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="text-white hover:text-primary hover:bg-black/50">
              <Settings className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="text-white hover:text-primary hover:bg-black/50">
              <Users className="h-5 w-5" />
            </Button>
          </div> */}
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-6 bg-background">
          {children}
        </main>
      </div>
      
      <Toaster />
    </div>
  );
} 