'use client';

import React, { useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format, addDays, isSameDay, isToday, addMonths } from 'date-fns';
import { pl } from 'date-fns/locale';
import { Trash2, Edit, ChevronLeft, ChevronRight, Clock, MapPin, User, Calendar as CalendarIcon, AlertCircle, CheckCircle, Clock3, Users, Plus } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

// Моковые данные бронирований
const mockBookings: Booking[] = [
  {
    id: '1',
    customerName: 'Иван Петров',
    packageName: 'ŚREDNI',
    date: new Date(2024, 2, 15, 14, 0),
    duration: 120,
    room: 'Комната 1',
    status: 'paid',
    people: 4
  },
  {
    id: '2',
    customerName: 'Анна Смирнова',
    packageName: 'TRUDNY',
    date: new Date(2024, 2, 15, 17, 0),
    duration: 180,
    room: 'Комната 2',
    status: 'deposit',
    people: 6
  },
  {
    id: '3',
    customerName: 'Петр Сидоров',
    packageName: 'ŁATWY',
    date: new Date(2024, 2, 16, 10, 0),
    duration: 45,
    room: 'Комната 1',
    status: 'unpaid',
    people: 2
  },
  {
    id: '4',
    customerName: 'Мария Иванова',
    packageName: 'BUŁKA Z MASŁEM',
    date: new Date(2024, 2, 17, 12, 0),
    duration: 30,
    room: 'Комната 3',
    status: 'paid',
    people: 1
  },
  {
    id: '5',
    customerName: 'Алексей Кузнецов',
    packageName: 'ŚREDNI',
    date: addDays(new Date(), 1),
    duration: 120,
    room: 'Комната 2',
    status: 'paid',
    people: 3
  },
  {
    id: '6',
    customerName: 'Ольга Новикова',
    packageName: 'TRUDNY',
    date: addDays(new Date(), 2),
    duration: 180,
    room: 'Комната 1',
    status: 'deposit',
    people: 5
  },
  {
    id: '7',
    customerName: 'Дмитрий Смирнов',
    packageName: 'ŁATWY',
    date: new Date(),
    duration: 45,
    room: 'Комната 3',
    status: 'unpaid',
    people: 2
  },
  // Добавляем больше бронирований на сегодня с разными статусами
  {
    id: '8',
    customerName: 'Екатерина Волкова',
    packageName: 'ŚREDNI',
    date: new Date(new Date().setHours(10, 0, 0, 0)),
    duration: 120,
    room: 'Комната 1',
    status: 'paid',
    people: 3
  },
  {
    id: '9',
    customerName: 'Андрей Соколов',
    packageName: 'TRUDNY',
    date: new Date(new Date().setHours(13, 30, 0, 0)),
    duration: 180,
    room: 'Комната 2',
    status: 'deposit',
    people: 5
  },
  {
    id: '10',
    customerName: 'Наталья Морозова',
    packageName: 'BUŁKA Z MASŁEM',
    date: new Date(new Date().setHours(16, 0, 0, 0)),
    duration: 30,
    room: 'Комната 3',
    status: 'paid',
    people: 2
  },
  {
    id: '11',
    customerName: 'Сергей Лебедев',
    packageName: 'ŁATWY',
    date: new Date(new Date().setHours(17, 30, 0, 0)),
    room: 'Комната 1',
    duration: 45,
    status: 'unpaid',
    people: 2
  }
];

// Определение типов для статусов и бронирований
type BookingStatus = 'paid' | 'deposit' | 'unpaid';

interface Booking {
  id: string;
  customerName: string;
  packageName: string;
  date: Date;
  duration: number;
  room: string;
  status: BookingStatus;
  people: number;
}

interface StatusConfig {
  bg: string;
  border: string;
  text: string;
  badge: string;
  icon: React.ReactNode;
}

// Определение цветов для статусов
const statusColors: Record<BookingStatus, StatusConfig> = {
  paid: {
    bg: 'bg-green-500/20',
    border: 'border-green-500',
    text: 'text-green-500',
    badge: 'success',
    icon: <CheckCircle className="h-4 w-4 text-green-500" />
  },
  deposit: {
    bg: 'bg-amber-500/20',
    border: 'border-amber-500',
    text: 'text-amber-500',
    badge: 'warning',
    icon: <Clock3 className="h-4 w-4 text-amber-500" />
  },
  unpaid: {
    bg: 'bg-red-500/20',
    border: 'border-red-500',
    text: 'text-red-500',
    badge: 'destructive',
    icon: <AlertCircle className="h-4 w-4 text-red-500" />
  }
};

// Компонент для отображения статуса бронирования
const StatusBadge = ({ status }: { status: BookingStatus }) => {
  const statusConfig = statusColors[status] || statusColors.unpaid;
  
  return (
    <Badge variant={statusConfig.badge as any} className="flex items-center gap-1">
      {statusConfig.icon}
      {status === 'paid' ? 'Оплачено' : status === 'deposit' ? 'Задаток' : 'Не оплачено'}
    </Badge>
  );
};

// Компонент для отображения временного слота
const TimeSlot = ({ 
  booking, 
  onDelete, 
  onEdit 
}: { 
  booking: Booking; 
  onDelete: (id: string) => void; 
  onEdit: (id: string) => void; 
}) => {
  const statusConfig = statusColors[booking.status] || statusColors.unpaid;
  const endTime = new Date(booking.date.getTime() + booking.duration * 60000);
  
  return (
    <Card className={cn(
      "mb-3 overflow-hidden transition-all hover:shadow-md",
      `border-l-4 ${statusConfig.border}`
    )}>
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={cn("font-bold text-lg", statusConfig.text)}>
                {format(booking.date, 'HH:mm')} - {format(endTime, 'HH:mm')}
              </span>
              <StatusBadge status={booking.status} />
            </div>
            <h4 className="font-semibold text-foreground">{booking.customerName}</h4>
            <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
              <div className="flex items-center gap-1">
                <Package className="h-3.5 w-3.5 text-primary" />
                <span className="text-muted-foreground">Пакет:</span>
                <span className="font-medium ml-1">{booking.packageName}</span>
              </div>
              <div className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 text-primary" />
                <span className="text-muted-foreground">Комната:</span>
                <span className="font-medium ml-1">{booking.room}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-primary" />
                <span className="text-muted-foreground">Длительность:</span>
                <span className="font-medium ml-1">{booking.duration} мин</span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="h-3.5 w-3.5 text-primary" />
                <span className="text-muted-foreground">Гостей:</span>
                <span className="font-medium ml-1">{booking.people}</span>
              </div>
            </div>
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" onClick={() => onEdit(booking.id)} className="h-8 w-8">
              <Edit className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => onDelete(booking.id)} className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Компонент для отображения дня в календаре
const CalendarDay = ({ 
  day, 
  bookings, 
  isSelected, 
  onSelect 
}: { 
  day: Date; 
  bookings: Booking[]; 
  isSelected: boolean; 
  onSelect: (date: Date) => void; 
}) => {
  const bookingsOnDay = bookings.filter(booking => 
    isSameDay(booking.date, day)
  );
  
  const hasUnpaid = bookingsOnDay.some(booking => booking.status === 'unpaid');
  const hasDeposit = bookingsOnDay.some(booking => booking.status === 'deposit');
  const hasPaid = bookingsOnDay.some(booking => booking.status === 'paid');
  
  let statusClass = '';
  if (hasUnpaid) statusClass = 'border-red-500 bg-red-500/10';
  else if (hasDeposit) statusClass = 'border-amber-500 bg-amber-500/10';
  else if (hasPaid) statusClass = 'border-green-500 bg-green-500/10';
  
  const isCurrentDay = isToday(day);
  
  return (
    <div 
      className={cn(
        "w-10 h-10 rounded-full flex items-center justify-center cursor-pointer transition-all border-2",
        isSelected ? "bg-primary text-white border-primary" : 
        isCurrentDay ? "border-primary text-primary" : 
        bookingsOnDay.length > 0 ? statusClass : "border-transparent hover:border-primary/30",
      )}
      onClick={() => onSelect(day)}
    >
      <span className="text-sm font-medium">{format(day, 'd')}</span>
      {bookingsOnDay.length > 0 && (
        <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2">
          <div className="flex gap-0.5">
            {hasPaid && <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>}
            {hasDeposit && <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div>}
            {hasUnpaid && <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>}
          </div>
        </div>
      )}
    </div>
  );
};

// Исправляем тип для объекта с группировкой бронирований по комнатам
type BookingsByRoom = Record<string, Booking[]>;

// Функция для группировки бронирований по комнатам
const groupBookingsByRoom = (bookings: Booking[]): BookingsByRoom => {
  return bookings.reduce<BookingsByRoom>((acc, booking) => {
    if (!acc[booking.room]) {
      acc[booking.room] = [];
    }
    acc[booking.room].push(booking);
    return acc;
  }, {});
};

// Функция для отображения всех бронирований
const AllBookingsView = ({ 
  bookings, 
  onDelete, 
  onEdit 
}: { 
  bookings: Booking[]; 
  onDelete: (id: string) => void; 
  onEdit: (id: string) => void; 
}) => {
  if (bookings.length === 0) {
    return (
      <div className="text-center py-8 bg-card/30 rounded-lg border border-dashed border-border">
        <CalendarIcon className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
        <h3 className="text-xl font-semibold text-muted-foreground">
          Нет бронирований на этот день
        </h3>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {bookings.map((booking) => (
        <TimeSlot 
          key={booking.id} 
          booking={booking} 
          onDelete={onDelete}
          onEdit={onEdit}
        />
      ))}
    </div>
  );
};

// Функция для отображения бронирований по комнатам
const RoomBookingsView = ({ 
  bookingsByRoom, 
  onDelete, 
  onEdit 
}: { 
  bookingsByRoom: BookingsByRoom; 
  onDelete: (id: string) => void; 
  onEdit: (id: string) => void; 
}) => {
  if (Object.keys(bookingsByRoom).length === 0) {
    return (
      <div className="text-center py-8 bg-card/30 rounded-lg border border-dashed border-border">
        <MapPin className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
        <h3 className="text-xl font-semibold text-muted-foreground">
          Нет бронирований на этот день
        </h3>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {Object.entries(bookingsByRoom).map(([room, roomBookings]) => (
        <div key={room}>
          <h3 className="text-lg font-semibold mb-2 flex items-center text-white">
            <MapPin className="h-4 w-4 mr-1.5 text-primary" />
            {room}
          </h3>
          <div className="space-y-1">
            {roomBookings.map((booking) => (
              <TimeSlot 
                key={booking.id} 
                booking={booking} 
                onDelete={onDelete}
                onEdit={onEdit}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

// Функция для получения правильного склонения слова "бронирование"
function getBookingCountText(count: number): string {
  // Определяем последнюю цифру числа
  const lastDigit = count % 10;
  const lastTwoDigits = count % 100;

  // Правила склонения для русского языка
  if (lastTwoDigits >= 11 && lastTwoDigits <= 19) {
    return 'бронирований';
  } else if (lastDigit === 1) {
    return 'бронирование';
  } else if (lastDigit >= 2 && lastDigit <= 4) {
    return 'бронирования';
  } else {
    return 'бронирований';
  }
}

export default function BookingCalendarPage() {
  const [date, setDate] = useState<Date>(new Date());
  const [view, setView] = useState<'month' | 'day'>('month');
  const [selectedDay, setSelectedDay] = useState<Date>(new Date());
  const { toast } = useToast();

  // Фильтрация бронирований для текущего месяца
  const bookingsForMonth = mockBookings.filter(booking => 
    booking.date.getMonth() === date.getMonth() && 
    booking.date.getFullYear() === date.getFullYear()
  );

  // Фильтрация бронирований для выбранного дня
  const bookingsForSelectedDay = mockBookings.filter(booking => 
    isSameDay(booking.date, selectedDay)
  );

  // Группировка бронирований по комнатам
  const bookingsByRoom = groupBookingsByRoom(bookingsForSelectedDay);

  // Статистика для выбранного дня
  const totalGuests = bookingsForSelectedDay.reduce((sum, booking) => sum + booking.people, 0);
  const paidBookings = bookingsForSelectedDay.filter(b => b.status === 'paid').length;
  const unpaidBookings = bookingsForSelectedDay.filter(b => b.status === 'unpaid').length;
  const depositBookings = bookingsForSelectedDay.filter(b => b.status === 'deposit').length;

  // Обработчик удаления бронирования
  const handleDeleteBooking = (id: string) => {
    // В реальном приложении здесь будет API-запрос
    // В демо просто показываем уведомление
    toast({
      title: "Бронирование удалено",
      description: `Бронирование с ID ${id} успешно удалено.`,
    });
  };

  // Обработчик редактирования бронирования
  const handleEditBooking = (id: string) => {
    // В реальном приложении здесь будет редирект на страницу редактирования
    // В демо просто показываем уведомление
    toast({
      title: "Редактирование бронирования",
      description: `Редактирование бронирования с ID ${id}.`,
    });
  };

  const handleAddBooking = () => {
    toast({
      title: "Новое бронирование",
      description: "Переход на страницу создания бронирования.",
    });
  };

  // Навигация по месяцам
  const prevMonth = () => {
    setDate(prevDate => addMonths(prevDate, -1));
  };

  const nextMonth = () => {
    setDate(prevDate => addMonths(prevDate, 1));
  };

  const goToToday = () => {
    setDate(new Date());
    setSelectedDay(new Date());
  };

  // Генерирует массив дней для текущего месяца с соответствующими бронированиями
  const generateDaysForMonth = () => {
    return Array.from({ length: new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate() }, (_, i) => {
      const day = new Date(date.getFullYear(), date.getMonth(), i + 1);
      const bookingsForDay = bookingsForMonth.filter(booking => 
        booking.date.getDate() === day.getDate()
      );
      return { day, bookings: bookingsForDay };
    });
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Календарь бронирований</h2>
          <p className="text-muted-foreground">
            Обзор всех бронирований в календарном виде
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={goToToday}>
            Сегодня
          </Button>
          <Button variant="outline" onClick={() => setView(view === 'month' ? 'day' : 'month')}>
            {view === 'month' ? 'Дневной вид' : 'Месячный вид'}
          </Button>
          <Button onClick={handleAddBooking}>
            <Plus className="mr-2 h-4 w-4" />
            Новое бронирование
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <Card className="border-primary/20 shadow-lg overflow-hidden">
            <CardHeader className="bg-card pb-2 border-b border-border">
              <div className="flex justify-between items-center">
                <CardTitle className="text-xl font-bold text-white">
                  {format(date, 'LLLL yyyy', { locale: pl })}
                </CardTitle>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={prevMonth} className="h-8 w-8 hover:bg-primary/10">
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={nextMonth} className="h-8 w-8 hover:bg-primary/10">
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <div className="grid grid-cols-7 gap-1 mb-2">
                {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map((day, index) => (
                  <div key={index} className="text-center text-xs font-medium text-muted-foreground">
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {generateDaysForMonth().map(({ day, bookings }, index) => {
                  const dayOfWeek = day.getDay();
                  // Добавляем пустые ячейки для выравнивания первого дня месяца
                  if (index === 0) {
                    const emptyDays = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
                    const emptyDivs = Array.from({ length: emptyDays }).map((_, i) => (
                      <div key={`empty-${i}`} className="w-10 h-10"></div>
                    ));
                    return [
                      ...emptyDivs,
                      <div key={day.toString()} className="relative flex items-center justify-center">
                        <CalendarDay 
                          day={day}
                          bookings={bookings}
                          isSelected={selectedDay ? isSameDay(selectedDay, day) : false}
                          onSelect={setSelectedDay}
                        />
                      </div>
                    ];
                  }
                  return (
                    <div key={day.toString()} className="relative flex items-center justify-center">
                      <CalendarDay 
                        day={day}
                        bookings={bookings}
                        isSelected={selectedDay ? isSameDay(selectedDay, day) : false}
                        onSelect={setSelectedDay}
                      />
                    </div>
                  );
                })}
              </div>
            </CardContent>
            <CardFooter className="bg-card/50 border-t border-border p-4">
              <div className="w-full grid grid-cols-3 gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span className="text-xs text-muted-foreground">Оплачено</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                  <span className="text-xs text-muted-foreground">Задаток</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <span className="text-xs text-muted-foreground">Не оплачено</span>
                </div>
              </div>
            </CardFooter>
          </Card>
          
          <Card className="mt-6 border-primary/20 shadow-lg">
            <CardHeader className="bg-card pb-2 border-b border-border">
              <CardTitle className="text-lg font-bold text-white flex items-center">
                <User className="mr-2 h-5 w-5 text-primary" />
                Статистика на {format(selectedDay, 'd MMMM', { locale: pl })}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-card/50 rounded-lg p-3 border border-border">
                  <div className="text-muted-foreground text-xs mb-1">Всего бронирований</div>
                  <div className="text-2xl font-bold text-white">{bookingsForSelectedDay.length}</div>
                </div>
                <div className="bg-card/50 rounded-lg p-3 border border-border">
                  <div className="text-muted-foreground text-xs mb-1">Гостей</div>
                  <div className="text-2xl font-bold text-white">{totalGuests}</div>
                </div>
                <div className="bg-card/50 rounded-lg p-3 border border-border">
                  <div className="text-muted-foreground text-xs mb-1">Оплачено</div>
                  <div className="text-2xl font-bold text-green-500">{paidBookings}</div>
                </div>
                <div className="bg-card/50 rounded-lg p-3 border border-border">
                  <div className="text-muted-foreground text-xs mb-1">Не оплачено</div>
                  <div className="text-2xl font-bold text-red-500">{unpaidBookings}</div>
                </div>
              </div>
              {bookingsForSelectedDay.length > 0 && (
                <div className="mt-4 pt-4 border-t border-border">
                  <div className="text-sm font-semibold text-white mb-2">Распределение по статусам</div>
                  <div className="space-y-2">
                    <div className="w-full h-2 bg-card/50 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-green-500 rounded-l-full" 
                        style={{ 
                          width: `${bookingsForSelectedDay.length ? (paidBookings / bookingsForSelectedDay.length) * 100 : 0}%`,
                          display: 'inline-block'
                        }} 
                      />
                      <div 
                        className="h-full bg-amber-500" 
                        style={{ 
                          width: `${bookingsForSelectedDay.length ? (depositBookings / bookingsForSelectedDay.length) * 100 : 0}%`,
                          display: 'inline-block'
                        }} 
                      />
                      <div 
                        className="h-full bg-red-500 rounded-r-full" 
                        style={{ 
                          width: `${bookingsForSelectedDay.length ? (unpaidBookings / bookingsForSelectedDay.length) * 100 : 0}%`,
                          display: 'inline-block'
                        }} 
                      />
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{paidBookings} оплачено</span>
                      <span>{depositBookings} задаток</span>
                      <span>{unpaidBookings} не оплачено</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        <div className="lg:col-span-2">
          <Card className="border-primary/20 shadow-lg">
            <CardHeader className="bg-card pb-2 border-b border-border">
              <div className="flex justify-between items-center">
                <CardTitle className="text-xl font-bold text-white flex items-center">
                  <CalendarIcon className="mr-2 h-5 w-5 text-primary" />
                  {selectedDay ? (
                    <span>
                      Бронирования на {format(selectedDay, 'd MMMM yyyy', { locale: pl })}
                    </span>
                  ) : (
                    <span>Выберите дату</span>
                  )}
                </CardTitle>
                <Button variant="outline" size="sm" onClick={handleAddBooking}>
                  <Plus className="mr-2 h-4 w-4" />
                  Добавить
                </Button>
              </div>
            </CardHeader>
            <Tabs defaultValue="all" className="w-full">
              <div className="px-4 pt-2">
                <TabsList className="bg-card/50 border border-border w-full grid grid-cols-2">
                  <TabsTrigger value="all" className="text-xs data-[state=active]:bg-primary data-[state=active]:text-white">
                    Все бронирования
                  </TabsTrigger>
                  <TabsTrigger value="rooms" className="text-xs data-[state=active]:bg-primary data-[state=active]:text-white">
                    По комнатам
                  </TabsTrigger>
                </TabsList>
              </div>
              
              <CardContent className="p-4">
                <TabsContent value="all" className="mt-0">
                  <AllBookingsView 
                    bookings={bookingsForSelectedDay}
                    onDelete={handleDeleteBooking}
                    onEdit={handleEditBooking}
                  />
                </TabsContent>
                
                <TabsContent value="rooms" className="mt-0">
                  <RoomBookingsView 
                    bookingsByRoom={bookingsByRoom}
                    onDelete={handleDeleteBooking}
                    onEdit={handleEditBooking}
                  />
                </TabsContent>
              </CardContent>
            </Tabs>
            <CardFooter className="bg-card/50 border-t border-border p-4 flex justify-between">
              <div className="text-sm text-muted-foreground">
                {bookingsForSelectedDay.length > 0 
                  ? `${bookingsForSelectedDay.length} ${getBookingCountText(bookingsForSelectedDay.length)} на ${format(selectedDay, 'd MMMM', { locale: pl })}`
                  : 'Нет бронирований на выбранную дату'
                }
              </div>
              <Button 
                variant="default" 
                className="bg-primary hover:bg-primary/90 text-white"
                onClick={handleAddBooking}
              >
                <Plus className="mr-2 h-4 w-4" />
                Добавить бронирование
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Компонент иконки пакета
function Package(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m16 16 3-8 3 8c-1.5 2-3 3-6 3-1 0-2 0-3-.5" />
      <path d="m2 16 3-8 3 8c-1.5 2-3 3-6 3-1 0-2 0-3-.5" />
      <path d="M7 21h10" />
      <path d="M12 3v18" />
      <path d="M3 7h18" />
    </svg>
  )
} 