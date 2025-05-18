'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Search, Plus, Trash2, Edit, Filter, Calendar } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import Link from 'next/link';
import Cookies from 'universal-cookie';

interface Booking {
  id: number;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  package_id: number;
  package_name: string;
  booking_date: string;
  start_time: string;
  duration: number;
  room_id: number;
  room_name: string;
  payment_status: 'pending' | 'paid' | 'partially_paid' | 'failed' | 'refunded';
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  total_price: number;
  paid_amount: number;
  notes: string | null;
}

export default function BookingsPage() {
  const cookies = new Cookies();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${cookies.get('access_token')}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Произошла ошибка');
    }
    
    if (response.status === 204) return null;
    return response.json();
  };

  const fetchBookings = async () => {
    try {
      setIsLoading(true);
      const data = await fetchWithAuth('http://localhost:89/api/bookings');
      // Преобразуем данные для удобства отображения
      const formattedData = data.map((booking: any) => ({
        ...booking,
        package_name: booking.package?.name || 'Неизвестно',
        room_name: booking.room?.name || 'Неизвестно',
        duration: calculateDuration(booking.start_time, booking.end_time)
      }));
      setBookings(formattedData);
    } catch (error) {
      toast({
        title: "Ошибка загрузки",
        description: error instanceof Error ? error.message : "Не удалось загрузить бронирования",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const calculateDuration = (start: string, end: string): number => {
    const startDate = new Date(`2000-01-01T${start}`);
    const endDate = new Date(`2000-01-01T${end}`);
    return (endDate.getTime() - startDate.getTime()) / (1000 * 60);
  };

  const handleDeleteBooking = async (id: number) => {
    if (confirm('Вы уверены, что хотите удалить это бронирование?')) {
      try {
        await fetchWithAuth(`http://localhost:89/api/bookings?id=${id}`, {
          method: 'DELETE'
        });
        
        setBookings(bookings.filter(booking => booking.id !== id));
        toast({
          title: "Бронирование удалено",
          description: "Бронирование было успешно удалено.",
          variant: "default"
        });
      } catch (error) {
        toast({
          title: "Ошибка удаления",
          description: error instanceof Error ? error.message : "Не удалось удалить бронирование",
          variant: "destructive",
        });
      }
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  // Фильтрация бронирований
  const filteredBookings = bookings.filter(booking => {
    // Фильтр по статусу
    if (statusFilter !== 'all' && booking.status !== statusFilter) {
      return false;
    }
    
    // Фильтр по статусу оплаты
    if (paymentFilter !== 'all' && booking.payment_status !== paymentFilter) {
      return false;
    }
    
    // Поиск по имени, email или телефону
    if (searchTerm) {
      const searchTermLower = searchTerm.toLowerCase();
      return (
        booking.customer_name.toLowerCase().includes(searchTermLower) ||
        booking.customer_email.toLowerCase().includes(searchTermLower) ||
        booking.customer_phone.includes(searchTerm)
      );
    }
    
    return true;
  });

  // Сортировка бронирований по дате (сначала новые)
  const sortedBookings = [...filteredBookings].sort((a, b) => 
    new Date(b.booking_date).getTime() - new Date(a.booking_date).getTime()
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <Badge className="bg-green-500">Подтверждено</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500">Ожидание</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-500">Отменено</Badge>;
      case 'completed':
        return <Badge className="bg-blue-500">Завершено</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getPaymentBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-500">Оплачено</Badge>;
      case 'partially_paid':
        return <Badge className="bg-yellow-500">Частично</Badge>;
      case 'pending':
        return <Badge className="bg-orange-500">Ожидание</Badge>;
      case 'failed':
        return <Badge className="bg-red-500">Ошибка</Badge>;
      case 'refunded':
        return <Badge className="bg-purple-500">Возврат</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  if (isLoading) {
    return <div className="p-6">Загрузка бронирований...</div>;
  }

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
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Статус брони" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все статусы</SelectItem>
                  <SelectItem value="pending">Ожидание</SelectItem>
                  <SelectItem value="confirmed">Подтверждено</SelectItem>
                  <SelectItem value="cancelled">Отменено</SelectItem>
                  <SelectItem value="completed">Завершено</SelectItem>
                </SelectContent>
              </Select>
              <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Статус оплаты" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все оплаты</SelectItem>
                  <SelectItem value="pending">Ожидание</SelectItem>
                  <SelectItem value="paid">Оплачено</SelectItem>
                  <SelectItem value="partially_paid">Частично</SelectItem>
                  <SelectItem value="failed">Ошибка</SelectItem>
                  <SelectItem value="refunded">Возврат</SelectItem>
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
                    <th className="text-left py-3 px-4 font-medium text-foreground">Бронирование</th>
                    <th className="text-left py-3 px-4 font-medium text-foreground">Оплата</th>
                    <th className="text-left py-3 px-4 font-medium text-foreground">Сумма</th>
                    <th className="text-right py-3 px-4 font-medium text-foreground">Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedBookings.map(booking => (
                    <tr key={booking.id} className="border-b border-border hover:bg-muted/50 animate-table-row">
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium text-foreground">{booking.customer_name}</p>
                          <p className="text-sm text-muted-foreground">{booking.customer_email}</p>
                          <p className="text-sm text-muted-foreground">{booking.customer_phone}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <p className="text-foreground">
                          {format(new Date(booking.booking_date), 'dd.MM.yyyy', { locale: ru })}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {booking.start_time} ({booking.duration} мин)
                        </p>
                      </td>
                      <td className="py-3 px-4 text-foreground">{booking.package_name}</td>
                      <td className="py-3 px-4 text-foreground">{booking.room_name}</td>
                      <td className="py-3 px-4">
                        {getStatusBadge(booking.status)}
                      </td>
                      <td className="py-3 px-4">
                        {getPaymentBadge(booking.payment_status)}
                      </td>
                      <td className="py-3 px-4 text-foreground font-medium">
                        {booking.total_price} PLN
                        {booking.paid_amount > 0 && (
                          <span className="block text-sm text-muted-foreground">
                            Оплачено: {booking.paid_amount} PLN
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex justify-end space-x-2">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            asChild
                          >
                            <Link href={`/admin/bookings/edit/${booking.id}`}>
                              <Edit className="h-4 w-4" />
                            </Link>
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