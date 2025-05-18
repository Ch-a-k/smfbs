"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, UsersIcon, CreditCardIcon, PackageIcon, TrendingUpIcon, CheckCircleIcon, AlertCircleIcon, ClockIcon, DoorOpenIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useEffect, useState } from "react";
import Cookies from "universal-cookie";


const Skeleton = ({ className }: { className?: string }) => (
  <div className={`bg-[#3a3637] animate-pulse rounded-md ${className}`} />
);

// Интерфейсы для типизации данных
interface DashboardStats {
  total_bookings: number;
  today_bookings: number;
  upcoming_bookings: number;
  total_customers: number;
  active_customers: number;
  total_rooms: number;
  active_rooms: number;
  revenue: {
    total: number;
    this_month: number;
    last_month: number;
  };
  payments: {
    total: number;
    successful: number;
    success_rate: number;
  };
}

interface RecentBooking {
  id: number;
  customer_name: string;
  package: {
    name: string;
    price: number;
  };
  booking_date: string;
  start_time: string;
  total_price: number;
  paid_amount: number;
  payment_status: string;
  room: {
    name: string;
    capacity: number;
  };
}

interface PopularPackage {
  id: number;
  name: string;
  description: string;
  bookings_count: number;
  total_revenue: number;
  price: number;
  is_best_seller: boolean;
}

interface TopCustomer {
  name: string;
  email: string;
  phone: string;
  bookings_count: number;
  total_spent: number;
  last_visit: string | null;
}

interface PaymentStats {
  booking_payment_status: {
    paid: number;
    partially_paid: number;
    unpaid: number;
  };
  payment_status: {
    completed: number;
    pending: number;
    failed: number;
  };
}

interface BookingActivity {
  date: string;
  count: number;
}

// Компонент для отображения статуса
const StatusBadge = ({ status }: { status: string }) => {
  const statusConfig = {
    paid: { color: "bg-green-500 hover:bg-green-600", text: "Оплачено" },
    completed: { color: "bg-green-500 hover:bg-green-600", text: "Успешно" },
    partially_paid: { color: "bg-yellow-500 hover:bg-yellow-600", text: "Частично" },
    pending: { color: "bg-yellow-500 hover:bg-yellow-600", text: "Ожидание" },
    unpaid: { color: "bg-red-500 hover:bg-red-600", text: "Не оплачено" },
    failed: { color: "bg-red-500 hover:bg-red-600", text: "Ошибка" }
  };

  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.unpaid;

  return (
    <Badge className={`${config.color} text-white`}>
      {config.text}
    </Badge>
  );
};

// Компонент загрузки
const LoadingSkeleton = () => (
  <div className="space-y-6 p-6">
    <div className="flex justify-between items-center">
      <Skeleton className="h-9 w-[250px]" />
      <div className="flex gap-2">
        <Skeleton className="h-9 w-[120px]" />
        <Skeleton className="h-9 w-[180px]" />
      </div>
    </div>
    
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => (
        <Card key={i} className="bg-[#2a2627] border-[#3a3637]">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <Skeleton className="h-4 w-[100px]" />
            <Skeleton className="h-4 w-4 rounded-full" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-7 w-[80px] mb-1" />
            <Skeleton className="h-3 w-[120px]" />
          </CardContent>
        </Card>
      ))}
    </div>
    
    <Tabs defaultValue="recent">
      <TabsList className="bg-[#1a1718] border border-[#3a3637]">
        <Skeleton className="h-9 w-[160px]" />
        <Skeleton className="h-9 w-[160px]" />
        <Skeleton className="h-9 w-[160px]" />
      </TabsList>
      <TabsContent value="recent">
        <Card className="bg-[#2a2627] border-[#3a3637]">
          <CardHeader>
            <Skeleton className="h-5 w-[200px]" />
            <Skeleton className="h-4 w-[300px]" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  </div>
);

export default function DashboardPage() {
  const cookies = new Cookies();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentBookings, setRecentBookings] = useState<RecentBooking[]>([]);
  const [popularPackages, setPopularPackages] = useState<PopularPackage[]>([]);
  const [topCustomers, setTopCustomers] = useState<TopCustomer[]>([]);
  const [paymentStats, setPaymentStats] = useState<PaymentStats | null>(null);
  const [bookingActivity, setBookingActivity] = useState<BookingActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:89';
        const headers = {
          'Authorization': `Bearer ${cookies.get('access_token')}`,
          'Content-Type': 'application/json'
        };

        const [statsRes, recentRes, popularRes, customersRes, paymentsRes, activityRes] = await Promise.all([
          fetch(`${apiUrl}/api/dashboard/stats`, { headers }),
          fetch(`${apiUrl}/api/dashboard/recent-bookings?limit=5`, { headers }),
          fetch(`${apiUrl}/api/dashboard/popular-packages?limit=4`, { headers }),
          fetch(`${apiUrl}/api/dashboard/top-customers?limit=3`, { headers }),
          fetch(`${apiUrl}/api/dashboard/payment-stats`, { headers }),
          fetch(`${apiUrl}/api/dashboard/booking-activity?days=7`, { headers })
        ]);

        if (!statsRes.ok || !recentRes.ok || !popularRes.ok || !customersRes.ok || !paymentsRes.ok || !activityRes.ok) {
          throw new Error('Ошибка загрузки данных');
        }

        const [statsData, recentData, popularData, customersData, paymentsData, activityData] = await Promise.all([
          statsRes.json(),
          recentRes.json(),
          popularRes.json(),
          customersRes.json(),
          paymentsRes.json(),
          activityRes.json()
        ]);

        setStats(statsData);
        setRecentBookings(recentData);
        setPopularPackages(popularData);
        setTopCustomers(customersData);
        setPaymentStats(paymentsData);
        setBookingActivity(activityData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Неизвестная ошибка");
        console.error("Dashboard error:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center p-6 max-w-md">
          <AlertCircleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Ошибка загрузки</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={() => window.location.reload()} variant="default">
            Попробовать снова
          </Button>
        </div>
      </div>
    );
  }

  if (!stats || !paymentStats) {
    return null;
  }

  // Расчет процентов для статусов оплаты
  const totalBookingsPayment = paymentStats.booking_payment_status.paid + 
                              paymentStats.booking_payment_status.partially_paid + 
                              paymentStats.booking_payment_status.unpaid;

  const paidPercentage = Math.round((paymentStats.booking_payment_status.paid / totalBookingsPayment) * 100);
  const partialPercentage = Math.round((paymentStats.booking_payment_status.partially_paid / totalBookingsPayment) * 100);
  const unpaidPercentage = 100 - paidPercentage - partialPercentage;

  // Расчет изменения дохода
  const revenueChange = stats.revenue.last_month > 0 
    ? ((stats.revenue.this_month - stats.revenue.last_month) / stats.revenue.last_month * 100).toFixed(1)
    : '0.0';

  // Форматирование даты
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  return (
    <div className="space-y-6 p-6">
      {/* Заголовок и кнопки */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white">Панель управления</h1>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/admin/calendar" className="flex items-center">
              <CalendarIcon className="mr-2 h-4 w-4" />
              Календарь
            </Link>
          </Button>
          <Button asChild variant="default">
            <Link href="/admin/bookings/add" className="flex items-center">
              <PackageIcon className="mr-2 h-4 w-4" />
              Новое бронирование
            </Link>
          </Button>
        </div>
      </div>

      {/* Статистические карточки */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Всего бронирований" 
          value={stats.total_bookings} 
          change={stats.today_bookings} 
          icon={<PackageIcon className="h-4 w-4 text-[#f36e21]" />}
          changeText="сегодня"
        />
        
        <StatCard 
          title="Клиенты" 
          value={stats.total_customers} 
          change={stats.active_customers} 
          icon={<UsersIcon className="h-4 w-4 text-[#f36e21]" />}
          changeText="активных"
        />
        
        <StatCard 
          title="Доход в этом месяце" 
          value={`${stats.revenue.this_month} zł`} 
          change={revenueChange} 
          icon={<TrendingUpIcon className="h-4 w-4 text-[#f36e21]" />}
          changeText="с прошлого месяца"
          isPercent={true}
        />
        
        <StatCard 
          title="Комнаты" 
          value={stats.total_rooms} 
          change={stats.active_rooms} 
          icon={<DoorOpenIcon className="h-4 w-4 text-[#f36e21]" />}
          changeText="активных"
        />
      </div>

      {/* Табы с основной информацией */}
      <Tabs defaultValue="recent" className="w-full">
        <TabsList className="bg-[#1a1718] border border-[#3a3637]">
          <TabsTrigger value="recent">Последние бронирования</TabsTrigger>
          <TabsTrigger value="popular">Популярные пакеты</TabsTrigger>
          <TabsTrigger value="customers">Топ клиентов</TabsTrigger>
        </TabsList>
        
        <TabsContent value="recent">
          <Card className="bg-[#2a2627] border-[#3a3637]">
            <CardHeader>
              <CardTitle className="text-white">Последние бронирования</CardTitle>
              <CardDescription className="text-muted-foreground">
                Список последних бронирований в системе
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-12 gap-4 text-xs font-medium text-muted-foreground border-b border-[#3a3637] pb-2 mt-2">
                  <div className="col-span-1">ID</div>
                  <div className="col-span-3">Клиент</div>
                  <div className="col-span-2">Пакет</div>
                  <div className="col-span-2">Комната</div>
                  <div className="col-span-2">Сумма</div>
                  <div className="col-span-2">Статус</div>
                </div>
                
                {recentBookings.map((booking) => (
                  <div key={booking.id} className="grid grid-cols-12 gap-4 text-sm items-center py-2">
                    <div className="col-span-1 text-muted-foreground">#{booking.id}</div>
                    <div className="col-span-3 text-white">
                      <div>{booking.customer_name}</div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(booking.booking_date).toLocaleDateString('ru-RU')} {booking.start_time}
                      </div>
                    </div>
                    <div className="col-span-2 text-white">
                      {booking.package.name}
                      <div className="text-xs text-muted-foreground">
                        {booking.package.price} zł
                      </div>
                    </div>
                    <div className="col-span-2 text-white">
                      {booking.room.name}
                      <div className="text-xs text-muted-foreground">
                        до {booking.room.capacity} чел.
                      </div>
                    </div>
                    <div className="col-span-2 text-white">
                      {booking.total_price} zł
                      <div className="text-xs text-muted-foreground">
                        оплачено {booking.paid_amount} zł
                      </div>
                    </div>
                    <div className="col-span-2">
                      <StatusBadge status={booking.payment_status} />
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-4 text-center">
                <Button asChild variant="ghost" className="text-[#f36e21] hover:text-[#f36e21] hover:bg-[#3a3637]">
                  <Link href="/admin/bookings">
                    Посмотреть все бронирования
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="popular">
          <Card className="bg-[#2a2627] border-[#3a3637]">
            <CardHeader>
              <CardTitle className="text-white">Популярные пакеты</CardTitle>
              <CardDescription className="text-muted-foreground">
                Статистика по популярным пакетам бронирования
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-12 gap-4 text-xs font-medium text-muted-foreground border-b border-[#3a3637] pb-2">
                  <div className="col-span-5">Название пакета</div>
                  <div className="col-span-2">Цена</div>
                  <div className="col-span-2">Бронирований</div>
                  <div className="col-span-3">Доход</div>
                </div>
                
                {popularPackages.map((pkg) => (
                  <div key={pkg.id} className="grid grid-cols-12 gap-4 text-sm items-center py-2">
                    <div className="col-span-5 text-white">
                      <div className="font-medium">{pkg.name}</div>
                      <div className="text-xs text-muted-foreground line-clamp-1">
                        {pkg.description}
                      </div>
                    </div>
                    <div className="col-span-2 text-white">
                      {pkg.price} zł
                      {pkg.is_best_seller && (
                        <Badge variant="outline" className="ml-2 text-xs text-[#f36e21] border-[#f36e21]">
                          Топ
                        </Badge>
                      )}
                    </div>
                    <div className="col-span-2 text-white">{pkg.bookings_count}</div>
                    <div className="col-span-3 text-white">{pkg.total_revenue} zł</div>
                  </div>
                ))}
              </div>
              
              <div className="mt-6">
                <h3 className="text-sm font-medium text-white mb-3">Распределение бронирований</h3>
                <div className="space-y-2">
                  {popularPackages.map((pkg) => (
                    <div key={`chart-${pkg.id}`} className="flex flex-col space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-white">{pkg.name}</span>
                        <span className="text-muted-foreground">{pkg.bookings_count} бронирований</span>
                      </div>
                      <div className="w-full bg-[#3a3637] rounded-full h-2">
                        <div 
                          className="bg-[#f36e21] h-2 rounded-full" 
                          style={{ 
                            width: `${(pkg.bookings_count / stats.total_bookings) * 100}%` 
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="customers">
          <Card className="bg-[#2a2627] border-[#3a3637]">
            <CardHeader>
              <CardTitle className="text-white">Топ клиентов</CardTitle>
              <CardDescription className="text-muted-foreground">
                Клиенты с наибольшим количеством бронирований
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-12 gap-4 text-xs font-medium text-muted-foreground border-b border-[#3a3637] pb-2">
                  <div className="col-span-4">Клиент</div>
                  <div className="col-span-2">Контакты</div>
                  <div className="col-span-2">Бронирований</div>
                  <div className="col-span-2">Потрачено</div>
                  <div className="col-span-2">Последний визит</div>
                </div>
                
                {topCustomers.map((customer, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-4 text-sm items-center py-2">
                    <div className="col-span-4 text-white font-medium">{customer.name}</div>
                    <div className="col-span-2 text-white">
                      <div className="text-xs text-muted-foreground">{customer.email}</div>
                      <div className="text-xs text-muted-foreground">{customer.phone}</div>
                    </div>
                    <div className="col-span-2 text-white">{customer.bookings_count}</div>
                    <div className="col-span-2 text-white">{customer.total_spent} zł</div>
                    <div className="col-span-2 text-white">
                      {customer.last_visit ? formatDate(customer.last_visit) : 'Нет данных'}
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-4 text-center">
                <Button asChild variant="ghost" className="text-[#f36e21] hover:text-[#f36e21] hover:bg-[#3a3637]">
                  <Link href="/admin/customers">
                    Посмотреть всех клиентов
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Нижние карточки со статистикой */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-[#2a2627] border-[#3a3637]">
          <CardHeader>
            <CardTitle className="text-white">Статистика по статусам</CardTitle>
            <CardDescription className="text-muted-foreground">
              Распределение бронирований по статусам оплаты
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <div className="space-y-4">
                <StatItem 
                  color="bg-green-500" 
                  label="Оплачено" 
                  value={`${paidPercentage}%`} 
                  count={paymentStats.booking_payment_status.paid}
                />
                <StatItem 
                  color="bg-yellow-500" 
                  label="Частично оплачено" 
                  value={`${partialPercentage}%`} 
                  count={paymentStats.booking_payment_status.partially_paid}
                />
                <StatItem 
                  color="bg-red-500" 
                  label="Не оплачено" 
                  value={`${unpaidPercentage}%`} 
                  count={paymentStats.booking_payment_status.unpaid}
                />
              </div>
              
              <div className="mt-6 relative w-24 h-24">
                <div 
                  className="absolute inset-0 rounded-full border-8 border-green-500" 
                  style={{ clipPath: 'polygon(50% 50%, 100% 50%, 100% 0, 0 0, 0 100%, 100% 100%, 100% 50%)' }}
                />
                <div 
                  className="absolute inset-0 rounded-full border-8 border-yellow-500" 
                  style={{ clipPath: `polygon(50% 50%, 100% 50%, 100% 0, ${100 - unpaidPercentage}% 0, 50% 50%)` }}
                />
                <div 
                  className="absolute inset-0 rounded-full border-8 border-red-500" 
                  style={{ clipPath: `polygon(50% 50%, ${100 - unpaidPercentage}% 0, 100% 0, 100% 0, 100% 0, 50% 50%)` }}
                />
              </div>
            </div>
            
            <div className="mt-6 pt-6 border-t border-[#3a3637]">
              <h3 className="text-sm font-medium text-white mb-3">Статусы платежей</h3>
              <div className="grid grid-cols-3 gap-4">
                <StatItem 
                  color="bg-green-500" 
                  label="Успешные" 
                  value={`${Math.round((paymentStats.payment_status.completed / stats.payments.total) * 100)}%`} 
                  count={paymentStats.payment_status.completed}
                  small
                />
                <StatItem 
                  color="bg-yellow-500" 
                  label="Ожидание" 
                  value={`${Math.round((paymentStats.payment_status.pending / stats.payments.total) * 100)}%`} 
                  count={paymentStats.payment_status.pending}
                  small
                />
                <StatItem 
                  color="bg-red-500" 
                  label="Ошибки" 
                  value={`${Math.round((paymentStats.payment_status.failed / stats.payments.total) * 100)}%`} 
                  count={paymentStats.payment_status.failed}
                  small
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#2a2627] border-[#3a3637]">
          <CardHeader>
            <CardTitle className="text-white">Активность бронирований</CardTitle>
            <CardDescription className="text-muted-foreground">
              Бронирования за последние 7 дней
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="text-sm font-medium text-white">
                  Всего бронирований: {bookingActivity.reduce((sum, item) => sum + item.count, 0)}
                </div>
                <div className="text-sm text-[#f36e21] font-medium">
                  {bookingActivity.length > 1 && bookingActivity[0].count !== 0 && (
                    <span>
                      {`+${Math.round(
                        ((bookingActivity[bookingActivity.length - 1].count - bookingActivity[0].count) / 
                        bookingActivity[0].count) * 100
                      )}% за период`}
                    </span>
                  )}
                </div>
              </div>
              
              <div className="space-y-2">
                {bookingActivity.map((activity, idx) => {
                  const maxCount = Math.max(...bookingActivity.map(a => a.count), 0);
                  const height = maxCount > 0 ? (activity.count / maxCount * 100) : 0;
                  const date = new Date(activity.date);
                  const dayName = date.toLocaleDateString('ru-RU', { weekday: 'short' });
                  
                  return (
                    <div key={idx} className="flex items-end gap-2">
                      <div className="text-xs text-muted-foreground w-8">{dayName}</div>
                      <div className="h-8 relative flex-1">
                        <div 
                          className="absolute bottom-0 left-0 right-0 bg-[#f36e21]/20 rounded-sm"
                          style={{ height: '100%' }}
                        />
                        <div 
                          className="absolute bottom-0 left-0 right-0 bg-[#f36e21] rounded-sm"
                          style={{ height: `${height}%` }}
                        />
                      </div>
                      <div className="text-xs text-white w-8">{activity.count}</div>
                    </div>
                  );
                })}
              </div>
              
              <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-[#3a3637]">
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">Средняя загрузка</div>
                  <div className="text-lg font-semibold text-white">
                    {stats.total_rooms > 0 ? Math.round((stats.total_bookings / (stats.total_rooms * 30)) * 100) : 0}%
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">Успешных платежей</div>
                  <div className="text-lg font-semibold text-white">
                    {stats.payments.success_rate.toFixed(1)}%
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Вспомогательные компоненты

interface StatCardProps {
  title: string;
  value: string | number;
  change: string | number;
  icon: React.ReactNode;
  changeText: string;
  isPercent?: boolean;
}

const StatCard = ({ title, value, change, icon, changeText, isPercent = false }: StatCardProps) => (
  <Card className="bg-[#2a2627] border-[#3a3637]">
    <CardHeader className="flex flex-row items-center justify-between pb-2">
      <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      {icon}
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold text-white">{value}</div>
      <p className="text-xs text-muted-foreground mt-1">
        {typeof change === 'number' && change > 0 ? '+' : ''}
        {change}
        {isPercent ? '%' : ''} {changeText}
      </p>
    </CardContent>
  </Card>
);

interface StatItemProps {
  color: string;
  label: string;
  value: string;
  count: number;
  small?: boolean;
}

const StatItem = ({ color, label, value, count, small = false }: StatItemProps) => (
  <div className={`flex items-center gap-2 ${small ? 'text-xs' : 'text-sm'}`}>
    <div className={`w-3 h-3 rounded-full ${color}`} />
    <div className="text-muted-foreground">{label}</div>
    <div className="ml-auto font-medium text-white">{value}</div>
    {!small && (
      <div className="text-muted-foreground">({count})</div>
    )}
  </div>
);