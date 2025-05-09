'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format, addDays } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Search, Plus, Trash2, Edit, Filter, Calendar } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import Link from 'next/link';

// Моковые данные бронирований
const mockBookings = [
  {
    id: '1',
    customerName: 'Иван Петров',
    email: 'ivan@example.com',
    phone: '+48123456789',
    packageName: 'ŚREDNI',
    date: new Date(2024, 2, 15, 14, 0),
    duration: 120,
    room: 'Комната 1',
    status: 'paid',
    totalPrice: 499
  },
  {
    id: '2',
    customerName: 'Анна Смирнова',
    email: 'anna@example.com',
    phone: '+48987654321',
    packageName: 'TRUDNY',
    date: new Date(2024, 2, 15, 17, 0),
    duration: 180,
    room: 'Комната 2',
    status: 'deposit',
    totalPrice: 999
  },
  {
    id: '3',
    customerName: 'Петр Сидоров',
    email: 'petr@example.com',
    phone: '+48555666777',
    packageName: 'ŁATWY',
    date: new Date(2024, 2, 16, 10, 0),
    duration: 45,
    room: 'Комната 1',
    status: 'unpaid',
    totalPrice: 299
  },
  {
    id: '4',
    customerName: 'Мария Иванова',
    email: 'maria@example.com',
    phone: '+48111222333',
    packageName: 'BUŁKA Z MASŁEM',
    date: new Date(2024, 2, 17, 12, 0),
    duration: 30,
    room: 'Комната 3',
    status: 'paid',
    totalPrice: 199
  },
  {
    id: '5',
    customerName: 'Алексей Кузнецов',
    email: 'alex@example.com',
    phone: '+48444555666',
    packageName: 'ŚREDNI',
    date: addDays(new Date(), 1),
    duration: 120,
    room: 'Комната 2',
    status: 'paid',
    totalPrice: 499
  },
  {
    id: '6',
    customerName: 'Ольга Новикова',
    email: 'olga@example.com',
    phone: '+48777888999',
    packageName: 'TRUDNY',
    date: addDays(new Date(), 2),
    duration: 180,
    room: 'Комната 1',
    status: 'deposit',
    totalPrice: 999
  },
  {
    id: '7',
    customerName: 'Дмитрий Смирнов',
    email: 'dmitry@example.com',
    phone: '+48333222111',
    packageName: 'ŁATWY',
    date: new Date(),
    duration: 45,
    room: 'Комната 3',
    status: 'unpaid',
    totalPrice: 299
  }
];

// Функция для получения статуса оплаты
const getStatusBadge = (status: string) => {
  switch (status) {
    case 'paid':
      return <Badge className="bg-green-500">Оплачено</Badge>;
    case 'deposit':
      return <Badge className="bg-yellow-500">Задаток</Badge>;
    case 'unpaid':
      return <Badge className="bg-red-500">Не оплачено</Badge>;
    default:
      return null;
  }
};

export default function BookingsPage() {
  const [bookings, setBookings] = useState(mockBookings);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isFiltersVisible, setIsFiltersVisible] = useState(false);
  const { toast } = useToast();

  // Фильтрация бронирований
  const filteredBookings = bookings.filter(booking => {
    // Фильтр по статусу
    if (statusFilter !== 'all' && booking.status !== statusFilter) {
      return false;
    }
    
    // Поиск по имени, email или телефону
    if (searchTerm) {
      const searchTermLower = searchTerm.toLowerCase();
      return (
        booking.customerName.toLowerCase().includes(searchTermLower) ||
        booking.email.toLowerCase().includes(searchTermLower) ||
        booking.phone.includes(searchTerm)
      );
    }
    
    return true;
  });

  // Сортировка бронирований по дате (сначала новые)
  const sortedBookings = [...filteredBookings].sort((a, b) => 
    b.date.getTime() - a.date.getTime()
  );

  // Удаление бронирования
  const handleDeleteBooking = (id: string) => {
    setBookings(bookings.filter(booking => booking.id !== id));
    toast({
      title: "Бронирование удалено",
      description: "Бронирование было успешно удалено.",
    });
  };

    return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Бронирования</h2>
          <p className="text-muted-foreground">
            Управление всеми бронированиями
            </p>
          </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link href="/admin/calendar">
              <Calendar className="mr-2 h-4 w-4" />
              Календарь
            </Link>
          </Button>
          <Button asChild>
            <Link href="/admin/bookings/add">
              <Plus className="mr-2 h-4 w-4" />
              Новое бронирование
            </Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Поиск по имени, email или телефону..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setIsFiltersVisible(!isFiltersVisible)}
              >
                <Filter className="mr-2 h-4 w-4" />
                Фильтры
              </Button>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Статус оплаты" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все статусы</SelectItem>
                  <SelectItem value="paid">Оплачено</SelectItem>
                  <SelectItem value="deposit">Задаток</SelectItem>
                  <SelectItem value="unpaid">Не оплачено</SelectItem>
                </SelectContent>
              </Select>
        </div>
      </div>
        </CardHeader>
        <CardContent>
          {sortedBookings.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Бронирований не найдено</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted">
                    <th className="text-left py-3 px-4 font-medium text-foreground">Клиент</th>
                    <th className="text-left py-3 px-4 font-medium text-foreground">Дата и время</th>
                    <th className="text-left py-3 px-4 font-medium text-foreground">Пакет</th>
                    <th className="text-left py-3 px-4 font-medium text-foreground">Комната</th>
                    <th className="text-left py-3 px-4 font-medium text-foreground">Статус</th>
                    <th className="text-left py-3 px-4 font-medium text-foreground">Цена</th>
                    <th className="text-right py-3 px-4 font-medium text-foreground">Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedBookings.map(booking => (
                    <tr key={booking.id} className="border-b border-border hover:bg-muted/50 animate-table-row">
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium text-foreground">{booking.customerName}</p>
                          <p className="text-sm text-muted-foreground">{booking.email}</p>
                          <p className="text-sm text-muted-foreground">{booking.phone}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <p className="text-foreground">{format(booking.date, 'dd.MM.yyyy')}</p>
                        <p className="text-sm text-muted-foreground">{format(booking.date, 'HH:mm')}</p>
                      </td>
                      <td className="py-3 px-4 text-foreground">{booking.packageName}</td>
                      <td className="py-3 px-4 text-foreground">{booking.room}</td>
                      <td className="py-3 px-4">
                        {booking.status === 'paid' && <Badge variant="success">Оплачено</Badge>}
                        {booking.status === 'deposit' && <Badge variant="warning">Задаток</Badge>}
                        {booking.status === 'unpaid' && <Badge variant="destructive">Не оплачено</Badge>}
                      </td>
                      <td className="py-3 px-4 text-foreground font-medium">{booking.totalPrice} PLN</td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex justify-end space-x-2">
                          <Button variant="ghost" size="icon" className="hover:bg-muted">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-destructive hover:bg-destructive/10"
                            onClick={() => handleDeleteBooking(booking.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
        </div>
      )}
        </CardContent>
      </Card>
    </div>
  );
} 