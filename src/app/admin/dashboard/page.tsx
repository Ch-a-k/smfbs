"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, UsersIcon, CreditCardIcon, PackageIcon, TrendingUpIcon, CheckCircleIcon, AlertCircleIcon, ClockIcon, DoorOpenIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

// Имитация данных для дашборда
const dashboardData = {
  totalBookings: 187,
  todayBookings: 12,
  upcomingBookings: 35,
  totalCustomers: 95,
  activeCustomers: 42,
  totalRooms: 3,
  activeRooms: 3,
  revenue: {
    total: 45780,
    thisMonth: 8950,
    lastMonth: 7650
  },
  recentBookings: [
    { id: '1', customerName: 'Иван Петров', packageName: 'ŚREDNI', date: '2023-06-15 10:00', status: 'paid', amount: 1200 },
    { id: '2', customerName: 'Мария Сидорова', packageName: 'TRUDNY', date: '2023-06-15 13:30', status: 'deposit', amount: 800 },
    { id: '3', customerName: 'Алексей Иванов', packageName: 'ŁATWY', date: '2023-06-15 16:00', status: 'unpaid', amount: 600 },
    { id: '4', customerName: 'Екатерина Волкова', packageName: 'ŚREDNI', date: '2023-06-16 10:00', status: 'paid', amount: 1200 },
    { id: '5', customerName: 'Андрей Соколов', packageName: 'TRUDNY', date: '2023-06-16 13:30', status: 'deposit', amount: 800 }
  ],
  popularPackages: [
    { name: 'ŚREDNI', bookings: 78, revenue: 93600 },
    { name: 'TRUDNY', bookings: 45, revenue: 67500 },
    { name: 'ŁATWY', bookings: 35, revenue: 21000 },
    { name: 'BUŁKA Z MASŁEM', bookings: 29, revenue: 11600 }
  ],
  topCustomers: [
    { name: 'Екатерина Новикова', bookings: 8, spent: 4000, lastVisit: '2024-03-15' },
    { name: 'Иван Петров', bookings: 5, spent: 2500, lastVisit: '2024-03-20' },
    { name: 'Мария Сидорова', bookings: 3, spent: 1500, lastVisit: '2024-02-05' }
  ]
};

// Компонент для отображения статуса бронирования
const StatusBadge = ({ status }: { status: string }) => {
  const statusConfig = {
    paid: { color: "bg-green-500 hover:bg-green-600", text: "Оплачено" },
    deposit: { color: "bg-yellow-500 hover:bg-yellow-600", text: "Депозит" },
    unpaid: { color: "bg-red-500 hover:bg-red-600", text: "Не оплачено" }
  };

  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.unpaid;

  return (
    <Badge className={`${config.color} text-white`}>
      {config.text}
    </Badge>
  );
};

export default function DashboardPage() {
  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-[#ffffff]">Панель управления</h1>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/admin/calendar">
              <CalendarIcon className="mr-2 h-4 w-4" />
              Календарь
            </Link>
          </Button>
          <Button asChild variant="default">
            <Link href="/admin/bookings/add">
              <PackageIcon className="mr-2 h-4 w-4" />
              Новое бронирование
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-[#2a2627] border-[#3a3637]">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-[#e0e0e0] text-sm font-medium">Всего бронирований</CardTitle>
            <PackageIcon className="h-4 w-4 text-[#f36e21]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#ffffff]">{dashboardData.totalBookings}</div>
            <p className="text-xs text-[#a0a0a0] mt-1">+{dashboardData.todayBookings} сегодня</p>
          </CardContent>
        </Card>
        
        <Card className="bg-[#2a2627] border-[#3a3637]">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-[#e0e0e0] text-sm font-medium">Клиенты</CardTitle>
            <UsersIcon className="h-4 w-4 text-[#f36e21]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#ffffff]">{dashboardData.totalCustomers}</div>
            <p className="text-xs text-[#a0a0a0] mt-1">{dashboardData.activeCustomers} активных</p>
          </CardContent>
        </Card>
        
        <Card className="bg-[#2a2627] border-[#3a3637]">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-[#e0e0e0] text-sm font-medium">Доход в этом месяце</CardTitle>
            <TrendingUpIcon className="h-4 w-4 text-[#f36e21]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#ffffff]">{dashboardData.revenue.thisMonth} zł</div>
            <p className="text-xs text-[#a0a0a0] mt-1">
              {dashboardData.revenue.thisMonth > dashboardData.revenue.lastMonth ? '+' : '-'}
              {Math.abs(((dashboardData.revenue.thisMonth - dashboardData.revenue.lastMonth) / dashboardData.revenue.lastMonth * 100)).toFixed(1)}% 
              с прошлого месяца
            </p>
          </CardContent>
        </Card>
        
        <Card className="bg-[#2a2627] border-[#3a3637]">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-[#e0e0e0] text-sm font-medium">Комнаты</CardTitle>
            <DoorOpenIcon className="h-4 w-4 text-[#f36e21]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#ffffff]">{dashboardData.totalRooms}</div>
            <p className="text-xs text-[#a0a0a0] mt-1">{dashboardData.activeRooms} активных</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="recent" className="w-full">
        <TabsList className="bg-[#1a1718] border border-[#3a3637]">
          <TabsTrigger value="recent">Последние бронирования</TabsTrigger>
          <TabsTrigger value="popular">Популярные пакеты</TabsTrigger>
          <TabsTrigger value="customers">Топ клиентов</TabsTrigger>
        </TabsList>
        <TabsContent value="recent">
          <Card className="bg-[#2a2627] border-[#3a3637]">
            <CardHeader>
              <CardTitle className="text-[#e0e0e0]">Последние бронирования</CardTitle>
              <CardDescription className="text-[#a0a0a0]">
                Список последних бронирований в системе
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-6 text-xs font-medium text-[#a0a0a0] border-b border-[#3a3637] pb-2">
                  <div>ID</div>
                  <div className="col-span-2">Клиент</div>
                  <div>Пакет</div>
                  <div>Сумма</div>
                  <div>Статус</div>
                </div>
                {dashboardData.recentBookings.map((booking) => (
                  <div key={booking.id} className="grid grid-cols-6 text-sm items-center">
                    <div className="text-[#a0a0a0]">#{booking.id}</div>
                    <div className="col-span-2 text-[#e0e0e0]">{booking.customerName}</div>
                    <div className="text-[#e0e0e0]">{booking.packageName}</div>
                    <div className="text-[#e0e0e0]">{booking.amount} zł</div>
                    <div>
                      <StatusBadge status={booking.status} />
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
              <CardTitle className="text-[#e0e0e0]">Популярные пакеты</CardTitle>
              <CardDescription className="text-[#a0a0a0]">
                Статистика по популярным пакетам бронирования
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-3 text-xs font-medium text-[#a0a0a0] border-b border-[#3a3637] pb-2">
                  <div>Название пакета</div>
                  <div>Количество</div>
                  <div>Доход</div>
                </div>
                {dashboardData.popularPackages.map((pkg) => (
                  <div key={pkg.name} className="grid grid-cols-3 text-sm items-center">
                    <div className="text-[#e0e0e0]">{pkg.name}</div>
                    <div className="text-[#e0e0e0]">{pkg.bookings} бронирований</div>
                    <div className="text-[#e0e0e0]">{pkg.revenue} zł</div>
                  </div>
                ))}
              </div>
              <div className="mt-6">
                <div className="space-y-2">
                  {dashboardData.popularPackages.map((pkg) => (
                    <div key={`chart-${pkg.name}`} className="flex flex-col space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-[#e0e0e0]">{pkg.name}</span>
                        <span className="text-[#a0a0a0]">{pkg.bookings} бронирований</span>
                      </div>
                      <div className="w-full bg-[#3a3637] rounded-full h-2">
                        <div 
                          className="bg-[#f36e21] h-2 rounded-full" 
                          style={{ width: `${(pkg.bookings / dashboardData.totalBookings) * 100}%` }}
                        ></div>
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
              <CardTitle className="text-[#e0e0e0]">Топ клиентов</CardTitle>
              <CardDescription className="text-[#a0a0a0]">
                Клиенты с наибольшим количеством бронирований
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-4 text-xs font-medium text-[#a0a0a0] border-b border-[#3a3637] pb-2">
                  <div>Клиент</div>
                  <div>Бронирований</div>
                  <div>Потрачено</div>
                  <div>Последний визит</div>
                </div>
                {dashboardData.topCustomers.map((customer, index) => (
                  <div key={index} className="grid grid-cols-4 text-sm items-center">
                    <div className="text-[#e0e0e0]">{customer.name}</div>
                    <div className="text-[#e0e0e0]">{customer.bookings}</div>
                    <div className="text-[#e0e0e0]">{customer.spent} zł</div>
                    <div className="text-[#e0e0e0]">{customer.lastVisit}</div>
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-[#2a2627] border-[#3a3637]">
          <CardHeader>
            <CardTitle className="text-[#e0e0e0]">Статистика по статусам</CardTitle>
            <CardDescription className="text-[#a0a0a0]">
              Распределение бронирований по статусам оплаты
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <div className="text-sm text-[#e0e0e0]">Оплачено</div>
                  <div className="text-sm font-medium text-[#e0e0e0] ml-auto">65%</div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <div className="text-sm text-[#e0e0e0]">Депозит</div>
                  <div className="text-sm font-medium text-[#e0e0e0] ml-auto">25%</div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <div className="text-sm text-[#e0e0e0]">Не оплачено</div>
                  <div className="text-sm font-medium text-[#e0e0e0] ml-auto">10%</div>
                </div>
              </div>
              <div className="relative w-24 h-24">
                <div className="absolute inset-0 rounded-full border-8 border-green-500" style={{ clipPath: 'polygon(50% 50%, 100% 50%, 100% 0, 0 0, 0 100%, 100% 100%, 100% 50%)' }}></div>
                <div className="absolute inset-0 rounded-full border-8 border-yellow-500" style={{ clipPath: 'polygon(50% 50%, 100% 50%, 100% 0, 65% 0, 50% 50%)' }}></div>
                <div className="absolute inset-0 rounded-full border-8 border-red-500" style={{ clipPath: 'polygon(50% 50%, 65% 0, 100% 0, 100% 0, 90% 0, 50% 50%)' }}></div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#2a2627] border-[#3a3637]">
          <CardHeader>
            <CardTitle className="text-[#e0e0e0]">Статистика бронирований</CardTitle>
            <CardDescription className="text-[#a0a0a0]">
              Активность бронирований в текущем месяце
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* График активности бронирований */}
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-2">
                <div className="text-sm text-[#e0e0e0] font-medium">Активность бронирований</div>
                <div className="text-sm text-[#f36e21] font-medium">+23% с прошлого месяца</div>
              </div>
              
              {/* Имитация графика активности */}
              <div className="space-y-2">
                {Array.from({ length: 7 }).map((_, index) => {
                  const height = Math.floor(Math.random() * 70) + 30;
                  const day = new Date();
                  day.setDate(day.getDate() - 6 + index);
                  const dayName = day.toLocaleDateString('ru-RU', { weekday: 'short' });
                  
                  return (
                    <div key={index} className="flex items-end gap-2">
                      <div className="text-xs text-[#a0a0a0] w-8">{dayName}</div>
                      <div className="h-8 relative flex-1">
                        <div 
                          className="absolute bottom-0 left-0 right-0 bg-[#f36e21]/20 rounded-sm"
                          style={{ height: '100%' }}
                        ></div>
                        <div 
                          className="absolute bottom-0 left-0 right-0 bg-[#f36e21] rounded-sm"
                          style={{ height: `${height}%` }}
                        ></div>
                      </div>
                      <div className="text-xs text-[#e0e0e0] w-8">{Math.floor(Math.random() * 10) + 1}</div>
                    </div>
                  );
                })}
              </div>
              
              {/* Ключевые показатели */}
              <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-[#3a3637]">
                <div className="space-y-1">
                  <div className="text-xs text-[#a0a0a0]">Средняя загрузка</div>
                  <div className="text-lg font-semibold text-[#e0e0e0]">76%</div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-[#a0a0a0]">Популярное время</div>
                  <div className="text-lg font-semibold text-[#e0e0e0]">16:00 - 18:00</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}