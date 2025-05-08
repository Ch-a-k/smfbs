import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CalendarDays, ListOrdered, Users, Settings, Package, BarChart3, Tag, LogOut } from 'lucide-react';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();
  
  const navItems = [
    {
      name: 'Rezerwacje',
      href: '/admin/bookings',
      icon: CalendarDays,
      active: pathname === '/admin/bookings'
    },
    {
      name: 'Klienci',
      href: '/admin/customers',
      icon: Users,
      active: pathname === '/admin/customers'
    },
    {
      name: 'Pakiety',
      href: '/admin/packages',
      icon: Package,
      active: pathname === '/admin/packages'
    },
    {
      name: 'Pokoje',
      href: '/admin/rooms',
      icon: ListOrdered,
      active: pathname === '/admin/rooms'
    },
    {
      name: 'Promocje',
      href: '/admin/promos',
      icon: Tag,
      active: pathname === '/admin/promos'
    },
    {
      name: 'Analityka',
      href: '/admin/analytics',
      icon: BarChart3,
      active: pathname === '/admin/analytics'
    },
    {
      name: 'Ustawienia',
      href: '/admin/settings',
      icon: Settings,
      active: pathname === '/admin/settings'
    }
  ];
  
  return (
    <div className="min-h-screen bg-black text-white flex">
      {/* Sidebar */}
      <div className="w-64 bg-gray-900 border-r border-gray-800 p-4 hidden md:block">
        <div className="mb-8 p-2">
          <Link href="/admin" className="flex items-center">
            <span className="text-[#f36e21] font-bold text-2xl">SMFBS</span>
            <span className="ml-2 text-white text-sm">Admin Panel</span>
          </Link>
        </div>
        
        <nav className="space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center px-3 py-2 rounded-lg ${
                item.active 
                  ? 'bg-[#f36e21] text-white' 
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              } transition-colors`}
            >
              <item.icon className="mr-3 h-5 w-5" />
              {item.name}
            </Link>
          ))}
          
          <div className="pt-6 mt-6 border-t border-gray-800">
            <Link
              href="/admin/logout"
              className="flex items-center px-3 py-2 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
            >
              <LogOut className="mr-3 h-5 w-5" />
              Wyloguj się
            </Link>
          </div>
        </nav>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col bg-gradient-to-b from-[#0f0f0f] to-[#1d1d1d]">
        {/* Mobile Header */}
        <div className="p-4 border-b border-gray-800 md:hidden">
          <div className="flex justify-between items-center">
            <Link href="/admin" className="flex items-center">
              <span className="text-[#f36e21] font-bold text-xl">SMFBS</span>
              <span className="ml-2 text-white text-xs">Admin Panel</span>
            </Link>
            <button className="block p-2 text-gray-400 hover:text-white">
              <svg viewBox="0 0 24 24" className="h-6 w-6 fill-current">
                <path d="M4 5h16a1 1 0 0 1 0 2H4a1 1 0 1 1 0-2zm0 6h16a1 1 0 0 1 0 2H4a1 1 0 0 1 0-2zm0 6h16a1 1 0 0 1 0 2H4a1 1 0 0 1 0-2z" />
              </svg>
            </button>
          </div>
        </div>
        
        {/* Page Content */}
        <main className="flex-1 p-6 overflow-auto">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
        
        {/* Footer */}
        <footer className="py-4 px-6 border-t border-gray-800 text-center text-gray-500 text-sm">
          &copy; {new Date().getFullYear()} Smash My Frustrations By Smashing. Wszelkie prawa zastrzeżone.
        </footer>
      </div>
    </div>
  );
} 