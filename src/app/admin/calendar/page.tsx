/**
 * Календарь бронирований для администратора
 * 
 * Эта страница позволяет администраторам просматривать и управлять всеми бронированиями
 * в календарном виде. Возможности включают в себя:
 * - Просмотр бронирований по дням месяца
 * - Просмотр детальной информации о бронированиях за выбранный день
 * - Статистику бронирований для выбранного дня
 * - Добавление, редактирование и удаление бронирований
 * 
 * @module AdminCalendar
 */

'use client';

import React, { useState, useMemo } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format, addDays, isSameDay, isToday, addMonths } from 'date-fns';
import { pl } from 'date-fns/locale';
import { Trash2, Edit, ChevronLeft, ChevronRight, Clock, MapPin, User, Calendar as CalendarIcon, AlertCircle, CheckCircle, Clock3, Users, Plus, X } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

/**
 * Типы статусов бронирований
 * - paid: полностью оплачено
 * - deposit: внесен только задаток
 * - unpaid: не оплачено
 */
type BookingStatus = 'paid' | 'deposit' | 'unpaid';

/**
 * Интерфейс бронирования
 * Определяет структуру объекта бронирования для отображения в календаре
 * и использования во всех компонентах страницы
 */
interface Booking {
  id: string;                // Уникальный идентификатор бронирования
  customerName: string;      // Имя клиента
  packageName: string;       // Название пакета услуг
  date: Date;                // Дата и время бронирования
  duration: number;          // Продолжительность в минутах
  room: string;              // Название комнаты/зала
  status: BookingStatus;     // Статус оплаты
  people: number;            // Количество людей
}

/**
 * Конфигурация стилей для разных статусов бронирований
 */
interface StatusConfig {
  bg: string;      // Цвет фона
  border: string;  // Цвет границы
  text: string;    // Цвет текста
  badge: string;   // Фон бейджа
  icon: React.ReactNode; // Иконка для статуса
}

/**
 * Конфигурация стилей для разных статусов бронирований
 * Используется для унифицированного отображения статусов во всех местах интерфейса
 */
const statusConfig: Record<BookingStatus, StatusConfig> = {
  'paid': {
    bg: 'bg-green-500/10',
    border: 'border-green-500/50',
    text: 'text-green-500',
    badge: 'bg-green-500',
    icon: <CheckCircle className="h-4 w-4" />
  },
  'deposit': {
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/50',
    text: 'text-amber-500',
    badge: 'bg-amber-500',
    icon: <Clock3 className="h-4 w-4" />
  },
  'unpaid': {
    bg: 'bg-red-500/10',
    border: 'border-red-500/50',
    text: 'text-red-500',
    badge: 'bg-red-500',
    icon: <AlertCircle className="h-4 w-4" />
  }
};

/**
 * Компонент для отображения бейджа статуса бронирования
 * Показывает цветной бейдж с названием статуса для визуального различения
 * разных статусов бронирований
 */
const StatusBadge = ({ status }: { status: BookingStatus }) => {
  const config = statusConfig[status];
  
  return (
    <Badge className={`${config.badge} text-white flex gap-1 items-center`}>
      {config.icon}
      {status === 'paid' ? 'Оплачено' : status === 'deposit' ? 'Задаток' : 'Не оплачено'}
    </Badge>
  );
};

/**
 * Компонент для отображения одного бронирования в списке
 * Показывает карточку с информацией о бронировании, включая
 * время, имя клиента, пакет, количество людей и статус
 */
const TimeSlot = ({ 
  booking, 
  onDelete, 
  onEdit 
}: { 
  booking: Booking; 
  onDelete: (id: string) => void; 
  onEdit: (id: string) => void; 
}) => {
  const config = statusConfig[booking.status] || statusConfig.unpaid;
  const endTime = new Date(booking.date.getTime() + booking.duration * 60000);
  
  return (
    <div className={`p-3 rounded-lg border ${config.border} ${config.bg} mb-2`}>
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-2 font-semibold text-white">
            <Clock className="w-4 h-4 text-primary" />
            <span>
              {format(booking.date, 'HH:mm')} - {format(endTime, 'HH:mm')}
            </span>
            <StatusBadge status={booking.status} />
          </div>
          <div className="mt-2">
            <div className="text-white">{booking.customerName}</div>
            <div className="text-sm text-muted-foreground flex items-center gap-4 mt-1">
              <div className="flex items-center gap-1">
                <Package className="w-3 h-3" />
                {booking.packageName}
              </div>
              <div className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                {booking.people} {booking.people === 1 ? 'человек' : 'людей'}
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 hover:bg-background/90"
            onClick={() => onEdit(booking.id)}
          >
            <Edit className="h-4 w-4 text-muted-foreground" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 hover:bg-background/90"
            onClick={() => onDelete(booking.id)}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </div>
    </div>
  );
};

// Моковые данные бронирований для демонстрации
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

/**
 * Компонент для отображения одного дня в календаре
 * Показывает ячейку с номером дня и индикаторами наличия бронирований
 * с разными статусами (если есть)
 */
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

/**
 * Тип для группировки бронирований по комнатам
 * Ключ - название комнаты, значение - массив бронирований в этой комнате
 */
type BookingsByRoom = Record<string, Booking[]>;

/**
 * Функция для группировки бронирований по комнатам
 * Преобразует массив бронирований в объект, где ключами
 * являются названия комнат, а значениями - массивы бронирований
 * в соответствующих комнатах
 * 
 * @param bookings Массив бронирований
 * @returns Объект с бронированиями, сгруппированными по комнатам
 */
const groupBookingsByRoom = (bookings: Booking[]): BookingsByRoom => {
  return bookings.reduce<BookingsByRoom>((acc, booking) => {
    if (!acc[booking.room]) {
      acc[booking.room] = [];
    }
    acc[booking.room].push(booking);
    return acc;
  }, {});
};

/**
 * Компонент для отображения всех бронирований в виде списка
 * Используется во вкладке "Все бронирования"
 */
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

/**
 * Компонент для отображения бронирований, сгруппированных по комнатам
 * Используется во вкладке "По комнатам"
 */
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

/**
 * Функция для получения правильного склонения слова "бронирование"
 * в зависимости от числа
 * 
 * @param count Количество бронирований
 * @returns Правильная форма слова "бронирование"
 */
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

/**
 * Основной компонент страницы календаря бронирований
 * Управляет состоянием календаря, фильтрует и отображает бронирования,
 * предоставляет интерфейс для взаимодействия пользователя с календарем
 * и списком бронирований
 * 
 * @returns React компонент страницы администратора с календарем бронирований
 */
export default function BookingCalendarPage() {
  // Состояние для текущего отображаемого месяца
  const [date, setDate] = useState<Date>(new Date());
  // Режим отображения календаря - месяц или день
  const [view, setView] = useState<'month' | 'day'>('month');
  // Выбранная дата для отображения бронирований
  const [selectedDay, setSelectedDay] = useState<Date>(new Date());
  // Хук для показа уведомлений
  const { toast } = useToast();

  // Фильтрация бронирований для текущего месяца
  // Используется для отображения меток на календаре и для просмотра бронирований по месяцам
  const bookingsForMonth = mockBookings.filter(booking => 
    booking.date.getMonth() === date.getMonth() && 
    booking.date.getFullYear() === date.getFullYear()
  );

  // Фильтрация бронирований для выбранного дня
  // Используется для отображения списка бронирований
  const bookingsForSelectedDay = mockBookings.filter(booking => 
    isSameDay(booking.date, selectedDay)
  );

  // Группировка бронирований по комнатам для выбранного дня
  // Используется для отображения во вкладке "По комнатам" при дневном просмотре
  const bookingsByRoom = groupBookingsByRoom(bookingsForSelectedDay);
  
  // Группировка бронирований по комнатам для целого месяца
  // Используется для отображения во вкладке "По комнатам" при месячном просмотре
  const bookingsByRoomMonth = groupBookingsByRoom(bookingsForMonth);
  
  // Состояние для выбранной вкладки в правой панели
  const [activeTab, setActiveTab] = useState<'all' | 'rooms'>('all');

  // Статистика для выбранного дня
  // Используется для отображения сводной информации
  const totalGuests = bookingsForSelectedDay.reduce((sum, booking) => sum + booking.people, 0);
  const paidBookings = bookingsForSelectedDay.filter(b => b.status === 'paid').length;
  const unpaidBookings = bookingsForSelectedDay.filter(b => b.status === 'unpaid').length;
  const depositBookings = bookingsForSelectedDay.filter(b => b.status === 'deposit').length;

  // Состояние для фильтрации комнат
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);

  // Получаем список уникальных комнат
  const uniqueRooms = useMemo(() => {
    const rooms = new Set<string>();
    mockBookings.forEach(booking => {
      rooms.add(booking.room);
    });
    return Array.from(rooms);
  }, []);

  // Фильтрованные бронирования по месяцу с учетом выбранной комнаты
  const filteredBookingsForMonth = useMemo(() => {
    if (!selectedRoom) {
      return bookingsForMonth;
    }
    return bookingsForMonth.filter(booking => booking.room === selectedRoom);
  }, [bookingsForMonth, selectedRoom]);

  // Группировка отфильтрованных бронирований по комнатам для месяца
  const filteredBookingsByRoomMonth = useMemo(() => {
    if (selectedRoom) {
      // Если выбрана конкретная комната, возвращаем только ее бронирования
      const filtered = bookingsForMonth.filter(booking => booking.room === selectedRoom);
      return { [selectedRoom]: filtered };
    }
    return bookingsByRoomMonth;
  }, [bookingsForMonth, bookingsByRoomMonth, selectedRoom]);

  /**
   * Обработчик удаления бронирования
   * В демо версии просто показывает уведомление
   * 
   * @param id Идентификатор удаляемого бронирования
   */
  const handleDeleteBooking = (id: string) => {
    // В реальном приложении здесь будет API-запрос
    // В демо просто показываем уведомление
    toast({
      title: "Бронирование удалено",
      description: `Бронирование с ID ${id} успешно удалено.`,
    });
  };

  /**
   * Обработчик редактирования бронирования
   * В демо версии просто показывает уведомление
   * 
   * @param id Идентификатор редактируемого бронирования
   */
  const handleEditBooking = (id: string) => {
    // В реальном приложении здесь будет редирект на страницу редактирования
    // В демо просто показываем уведомление
    toast({
      title: "Редактирование бронирования",
      description: `Редактирование бронирования с ID ${id}.`,
    });
  };

  /**
   * Обработчик добавления нового бронирования
   * В демо версии просто показывает уведомление
   */
  const handleAddBooking = () => {
    toast({
      title: "Новое бронирование",
      description: "Переход на страницу создания бронирования.",
    });
  };

  /**
   * Переход к предыдущему месяцу в календаре
   */
  const prevMonth = () => {
    setDate(prevDate => addMonths(prevDate, -1));
  };

  /**
   * Переход к следующему месяцу в календаре
   */
  const nextMonth = () => {
    setDate(prevDate => addMonths(prevDate, 1));
  };

  /**
   * Переход к текущей дате в календаре
   */
  const goToToday = () => {
    setDate(new Date());
    setSelectedDay(new Date());
  };

  /**
   * Генерирует массив дней для текущего месяца с бронированиями
   * Используется для отображения календаря месяца
   * 
   * @returns Массив объектов с датой и бронированиями для нее
   */
  const generateDaysForMonth = () => {
    return Array.from({ length: new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate() }, (_, i) => {
      const day = new Date(date.getFullYear(), date.getMonth(), i + 1);
      const bookingsForDay = bookingsForMonth.filter(booking => 
        booking.date.getDate() === day.getDate()
      );
      return { day, bookings: bookingsForDay };
    });
  };

  /**
   * Компонент для отображения бронирований по комнатам за месяц
   * Используется во вкладке "По комнатам" при месячном просмотре
   */
  const MonthlyRoomBookingsView = ({ 
    bookingsByRoom, 
    onDelete, 
    onEdit,
    onDaySelect
  }: { 
    bookingsByRoom: BookingsByRoom; 
    onDelete: (id: string) => void; 
    onEdit: (id: string) => void;
    onDaySelect: (date: Date) => void;
  }) => {
    if (Object.keys(bookingsByRoom).length === 0) {
      return (
        <div className="text-center py-8 bg-card/30 rounded-lg border border-dashed border-border">
          <MapPin className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
          <h3 className="text-xl font-semibold text-muted-foreground">
            Нет бронирований на этот месяц
          </h3>
        </div>
      );
    }

    // Функция для группировки бронирований по дням
    const groupBookingsByDay = (bookings: Booking[]) => {
      return bookings.reduce<Record<string, Booking[]>>((acc, booking) => {
        const dayKey = format(booking.date, 'yyyy-MM-dd');
        if (!acc[dayKey]) {
          acc[dayKey] = [];
        }
        acc[dayKey].push(booking);
        return acc;
      }, {});
    };

    return (
      <div className="space-y-6">
        {Object.entries(bookingsByRoom).map(([room, roomBookings]) => {
          // Группируем бронирования по дням
          const bookingsByDay = groupBookingsByDay(roomBookings);
          
          return (
            <div key={room}>
              <h3 className="text-lg font-semibold mb-3 flex items-center text-white">
                <MapPin className="h-4 w-4 mr-1.5 text-primary" />
                {room} <span className="text-muted-foreground ml-2 text-sm">({roomBookings.length} бронирований)</span>
              </h3>
              
              <div className="space-y-4">
                {Object.entries(bookingsByDay).map(([dayKey, dayBookings]) => {
                  const dayDate = new Date(dayKey);
                  
                  return (
                    <div key={dayKey} className="bg-card/30 border border-border rounded-lg p-3">
                      <div 
                        className="flex items-center mb-2 cursor-pointer hover:text-primary transition-colors"
                        onClick={() => onDaySelect(dayDate)}
                      >
                        <CalendarIcon className="h-4 w-4 mr-1.5" />
                        <span className="font-medium">{format(dayDate, 'd MMMM (EEEE)', { locale: pl })}</span>
                      </div>
                      
                      <div className="space-y-2">
                        {dayBookings
                          .sort((a, b) => a.date.getTime() - b.date.getTime())
                          .map(booking => (
                            <TimeSlot 
                              key={booking.id} 
                              booking={booking} 
                              onDelete={onDelete}
                              onEdit={onEdit}
                            />
                          ))
                        }
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // Компонент фильтра комнат
  const RoomFilter = () => {
    return (
      <div className="flex items-center space-x-2 mb-3">
        <div className="text-sm text-muted-foreground">Фильтр комнат:</div>
        <select 
          className="bg-card border border-border rounded-md p-1 text-sm outline-none focus:ring-1 focus:ring-primary"
          value={selectedRoom || ''}
          onChange={(e) => setSelectedRoom(e.target.value || null)}
        >
          <option value="">Все комнаты</option>
          {uniqueRooms.map(room => (
            <option key={room} value={room}>{room}</option>
          ))}
        </select>
        {selectedRoom && (
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-7 px-2" 
            onClick={() => setSelectedRoom(null)}
          >
            <X className="h-3 w-3 mr-1" />
            Сбросить
          </Button>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6 p-6">
      {/* Заголовок и кнопки управления */}
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
        {/* Левая колонка - календарь и статистика */}
        <div className="lg:col-span-1">
          {/* Календарь */}
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
            {/* Содержимое календаря */}
            <CardContent className="p-4">
              {/* Заголовки дней недели */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map((day, index) => (
                  <div key={index} className="text-center text-xs font-medium text-muted-foreground">
                    {day}
                  </div>
                ))}
              </div>
              {/* Сетка дней месяца */}
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
            {/* Легенда календаря */}
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
          
          {/* Статистика для выбранного дня */}
          <Card className="mt-6 border-primary/20 shadow-lg">
            <CardHeader className="bg-card pb-2 border-b border-border">
              <CardTitle className="text-lg font-bold text-white flex items-center">
                <User className="mr-2 h-5 w-5 text-primary" />
                Статистика на {format(selectedDay, 'd MMMM', { locale: pl })}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              {/* Основные показатели */}
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
              {/* Визуализация распределения по статусам */}
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
        
        {/* Правая колонка - список бронирований */}
        <div className="lg:col-span-2">
          <Card className="border-primary/20 shadow-lg">
            <CardHeader className="bg-card pb-2 border-b border-border">
              <div className="flex justify-between items-center">
                <CardTitle className="text-xl font-bold text-white flex items-center">
                  <CalendarIcon className="mr-2 h-5 w-5 text-primary" />
                  {view === 'month' ? (
                    <span>
                      Бронирования за {format(date, 'LLLL yyyy', { locale: pl })}
                    </span>
                  ) : selectedDay ? (
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
            {/* Вкладки для переключения между видами бронирований */}
            <Tabs defaultValue="all" className="w-full" value={activeTab} onValueChange={(value) => setActiveTab(value as 'all' | 'rooms')}>
              <div className="px-4 pt-2">
                <TabsList className="bg-card/50 border border-border w-full grid grid-cols-2">
                  <TabsTrigger 
                    value="all" 
                    className="text-xs data-[state=active]:bg-primary data-[state=active]:text-white"
                  >
                    {view === 'month' ? 'Все за месяц' : 'Все на день'}
                  </TabsTrigger>
                  <TabsTrigger 
                    value="rooms" 
                    className="text-xs data-[state=active]:bg-primary data-[state=active]:text-white"
                  >
                    {view === 'month' ? 'По комнатам за месяц' : 'По комнатам на день'}
                  </TabsTrigger>
                </TabsList>
              </div>
              
              <CardContent className="p-4">
                {/* Содержимое вкладки "Все бронирования" */}
                <TabsContent value="all" className="mt-0">
                  {view === 'month' ? (
                    // Отображение всех бронирований за месяц
                    <div className="space-y-4">
                      <RoomFilter />
                      
                      {filteredBookingsForMonth.length > 0 ? (
                        Array.from({ length: new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate() }, (_, i) => {
                          const day = new Date(date.getFullYear(), date.getMonth(), i + 1);
                          const bookingsForDay = filteredBookingsForMonth.filter(booking => 
                            isSameDay(booking.date, day)
                          );
                          
                          // Пропускаем дни без бронирований
                          if (bookingsForDay.length === 0) return null;
                          
                          return (
                            <div key={day.toString()} className="bg-card/30 border border-border rounded-lg p-3">
                              <div 
                                className="flex items-center mb-2 cursor-pointer hover:text-primary transition-colors"
                                onClick={() => {
                                  setSelectedDay(day);
                                  setView('day');
                                }}
                              >
                                <CalendarIcon className="h-4 w-4 mr-1.5" />
                                <span className="font-medium">{format(day, 'd MMMM (EEEE)', { locale: pl })}</span>
                                <Badge variant="outline" className="ml-2">
                                  {bookingsForDay.length} {getBookingCountText(bookingsForDay.length)}
                                </Badge>
                              </div>
                              
                              <div className="space-y-2">
                                {bookingsForDay
                                  .sort((a, b) => a.date.getTime() - b.date.getTime())
                                  .map(booking => (
                                    <TimeSlot 
                                      key={booking.id} 
                                      booking={booking} 
                                      onDelete={handleDeleteBooking}
                                      onEdit={handleEditBooking}
                                    />
                                  ))
                                }
                              </div>
                            </div>
                          );
                        }).filter(Boolean)
                      ) : (
                        <div className="text-center py-8 bg-card/30 rounded-lg border border-dashed border-border">
                          <CalendarIcon className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                          <h3 className="text-xl font-semibold text-muted-foreground">
                            {selectedRoom 
                              ? `Нет бронирований для комнаты "${selectedRoom}" за этот месяц` 
                              : 'Нет бронирований за этот месяц'
                            }
                          </h3>
                        </div>
                      )}
                    </div>
                  ) : (
                    // Отображение бронирований на выбранный день
                    <AllBookingsView 
                      bookings={bookingsForSelectedDay}
                      onDelete={handleDeleteBooking}
                      onEdit={handleEditBooking}
                    />
                  )}
                </TabsContent>
                
                {/* Содержимое вкладки "По комнатам" */}
                <TabsContent value="rooms" className="mt-0">
                  {view === 'month' ? (
                    // Отображение бронирований по комнатам за месяц
                    <div className="space-y-4">
                      <RoomFilter />
                      
                      <MonthlyRoomBookingsView 
                        bookingsByRoom={filteredBookingsByRoomMonth}
                        onDelete={handleDeleteBooking}
                        onEdit={handleEditBooking}
                        onDaySelect={(day) => {
                          setSelectedDay(day);
                          setView('day');
                        }}
                      />
                    </div>
                  ) : (
                    // Отображение бронирований по комнатам на выбранный день
                    <RoomBookingsView 
                      bookingsByRoom={bookingsByRoom}
                      onDelete={handleDeleteBooking}
                      onEdit={handleEditBooking}
                    />
                  )}
                </TabsContent>
              </CardContent>
            </Tabs>
            {/* Футер с информацией и кнопкой добавления */}
            <CardFooter className="bg-card/50 border-t border-border p-4 flex justify-between">
              <div className="text-sm text-muted-foreground">
                {view === 'month' ? (
                  bookingsForMonth.length > 0 
                    ? `${bookingsForMonth.length} ${getBookingCountText(bookingsForMonth.length)} за ${format(date, 'LLLL yyyy', { locale: pl })}`
                    : 'Нет бронирований за выбранный месяц'
                ) : (
                  bookingsForSelectedDay.length > 0 
                    ? `${bookingsForSelectedDay.length} ${getBookingCountText(bookingsForSelectedDay.length)} на ${format(selectedDay, 'd MMMM', { locale: pl })}`
                    : 'Нет бронирований на выбранную дату'
                )}
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}

/**
 * Компонент иконки пакета
 * Svg иконка для отображения пакетов в интерфейсе
 * 
 * @param props Свойства SVG элемента
 * @returns SVG элемент иконки пакета
 */
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