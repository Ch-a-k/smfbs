'use client';

import { useState, useEffect, useMemo } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format, addDays, isSameDay, isToday, addMonths, addMinutes } from 'date-fns';
import { pl } from 'date-fns/locale';
import { Trash2, Edit, ChevronLeft, ChevronRight, Clock, MapPin, User, Calendar as CalendarIcon, AlertCircle, CheckCircle, Clock3, Users, Plus, X, Package } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import Cookies from 'universal-cookie';
import Link from 'next/link';

// Enums matching backend
enum BookingStatus {
  PENDING = "pending",
  CONFIRMED = "confirmed",
  CANCELLED = "cancelled",
  COMPLETED = "completed"
}

enum PaymentStatus {
  PENDING = "pending",
  PAID = "paid",
  PARTIALLY_PAID = "partially_paid",
  FAILED = "failed",
  REFUNDED = "refunded"
}

interface Booking {
  id: number;
  room_id: number;
  package_id: number;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  num_people: number;
  status: BookingStatus;
  payment_status: PaymentStatus;
  total_price: number;
  paid_amount: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
  room?: Room;
  package?: Package;
}

interface Room {
  id: number;
  name: string;
  capacity: number;
  max_people: number;
  is_active: boolean;
  available: boolean;
}

interface Package {
  id: number;
  name: string;
  description: string;
  price: number;
  deposit_amount: number;
  duration: number;
  max_people: number;
  is_active: boolean;
  is_best_seller: boolean;
}

interface StatusConfig {
  bg: string;
  border: string;
  text: string;
  badge: string;
  icon: React.ReactNode;
}

const bookingStatusConfig: Record<BookingStatus, StatusConfig> = {
  [BookingStatus.PENDING]: {
    bg: 'bg-yellow-500/10',
    border: 'border-yellow-500/50',
    text: 'text-yellow-500',
    badge: 'bg-yellow-500',
    icon: <Clock3 className="h-4 w-4" />
  },
  [BookingStatus.CONFIRMED]: {
    bg: 'bg-green-500/10',
    border: 'border-green-500/50',
    text: 'text-green-500',
    badge: 'bg-green-500',
    icon: <CheckCircle className="h-4 w-4" />
  },
  [BookingStatus.CANCELLED]: {
    bg: 'bg-red-500/10',
    border: 'border-red-500/50',
    text: 'text-red-500',
    badge: 'bg-red-500',
    icon: <AlertCircle className="h-4 w-4" />
  },
  [BookingStatus.COMPLETED]: {
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/50',
    text: 'text-blue-500',
    badge: 'bg-blue-500',
    icon: <CheckCircle className="h-4 w-4" />
  }
};

const paymentStatusConfig: Record<PaymentStatus, StatusConfig> = {
  [PaymentStatus.PENDING]: {
    bg: 'bg-yellow-500/10',
    border: 'border-yellow-500/50',
    text: 'text-yellow-500',
    badge: 'bg-yellow-500',
    icon: <Clock3 className="h-4 w-4" />
  },
  [PaymentStatus.PAID]: {
    bg: 'bg-green-500/10',
    border: 'border-green-500/50',
    text: 'text-green-500',
    badge: 'bg-green-500',
    icon: <CheckCircle className="h-4 w-4" />
  },
  [PaymentStatus.PARTIALLY_PAID]: {
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/50',
    text: 'text-blue-500',
    badge: 'bg-blue-500',
    icon: <Clock3 className="h-4 w-4" />
  },
  [PaymentStatus.FAILED]: {
    bg: 'bg-red-500/10',
    border: 'border-red-500/50',
    text: 'text-red-500',
    badge: 'bg-red-500',
    icon: <AlertCircle className="h-4 w-4" />
  },
  [PaymentStatus.REFUNDED]: {
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/50',
    text: 'text-purple-500',
    badge: 'bg-purple-500',
    icon: <CheckCircle className="h-4 w-4" />
  }
};

const StatusBadge = ({ status, type }: { status: BookingStatus | PaymentStatus, type: 'booking' | 'payment' }) => {
  const config = type === 'booking' ? bookingStatusConfig[status as BookingStatus] : paymentStatusConfig[status as PaymentStatus];
  
  return (
    <Badge className={`${config.badge} text-white flex gap-1 items-center`}>
      {config.icon}
      {status === BookingStatus.PENDING && 'Ожидание'}
      {status === BookingStatus.CONFIRMED && 'Подтверждено'}
      {status === BookingStatus.CANCELLED && 'Отменено'}
      {status === BookingStatus.COMPLETED && 'Завершено'}
      {status === PaymentStatus.PENDING && 'Ожидание оплаты'}
      {status === PaymentStatus.PAID && 'Оплачено'}
      {status === PaymentStatus.PARTIALLY_PAID && 'Частично оплачено'}
      {status === PaymentStatus.FAILED && 'Ошибка оплаты'}
      {status === PaymentStatus.REFUNDED && 'Возврат'}
    </Badge>
  );
};

const TimeSlot = ({ 
  booking, 
  onDelete, 
  onEdit 
}: { 
  booking: Booking; 
  onDelete: (id: number) => void; 
  onEdit: (id: number) => void; 
}) => {
  const bookingDate = new Date(`${booking.booking_date}T${booking.start_time}`);
  const endTime = new Date(`${booking.booking_date}T${booking.end_time}`);
  
  return (
    <div className={`p-3 rounded-lg border ${bookingStatusConfig[booking.status].border} ${bookingStatusConfig[booking.status].bg} mb-2`}>
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-2 font-semibold text-white">
            <Clock className="w-4 h-4 text-primary" />
            <span>
              {format(bookingDate, 'HH:mm')} - {format(endTime, 'HH:mm')}
            </span>
            <StatusBadge status={booking.status} type="booking" />
            <StatusBadge status={booking.payment_status} type="payment" />
          </div>
          <div className="mt-2">
            <div className="text-white">{booking.customer_name}</div>
            <div className="text-sm text-muted-foreground flex items-center gap-4 mt-1">
              <div className="flex items-center gap-1">
                <Package className="w-3 h-3" />
                {booking.package?.name || 'Неизвестный пакет'}
              </div>
              <div className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                {booking.num_people} чел.
              </div>
              <div className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {booking.room?.name || 'Неизвестная комната'}
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
  const hasPending = bookings.some(b => b.status === BookingStatus.PENDING);
  const hasConfirmed = bookings.some(b => b.status === BookingStatus.CONFIRMED);
  const hasCancelled = bookings.some(b => b.status === BookingStatus.CANCELLED);
  const hasCompleted = bookings.some(b => b.status === BookingStatus.COMPLETED);
  
  let statusClass = '';
  if (hasPending) statusClass = 'border-yellow-500 bg-yellow-500/10';
  else if (hasConfirmed) statusClass = 'border-green-500 bg-green-500/10';
  else if (hasCancelled) statusClass = 'border-red-500 bg-red-500/10';
  else if (hasCompleted) statusClass = 'border-blue-500 bg-blue-500/10';
  
  const isCurrentDay = isToday(day);
  
  return (
    <div 
      className={cn(
        "w-10 h-10 rounded-full flex items-center justify-center cursor-pointer transition-all border-2",
        isSelected ? "bg-primary text-white border-primary" : 
        isCurrentDay ? "border-primary text-primary" : 
        bookings.length > 0 ? statusClass : "border-transparent hover:border-primary/30",
      )}
      onClick={() => onSelect(day)}
    >
      <span className="text-sm font-medium">{format(day, 'd')}</span>
      {bookings.length > 0 && (
        <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2">
          <div className="flex gap-0.5">
            {hasConfirmed && <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>}
            {hasPending && <div className="w-1.5 h-1.5 rounded-full bg-yellow-500"></div>}
            {hasCancelled && <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>}
            {hasCompleted && <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>}
          </div>
        </div>
      )}
    </div>
  );
};

type BookingsByRoom = Record<string, Booking[]>;

const groupBookingsByRoom = (bookings: Booking[]): BookingsByRoom => {
  return bookings.reduce<BookingsByRoom>((acc, booking) => {
    const roomName = booking.room?.name || 'Неизвестная комната';
    if (!acc[roomName]) {
      acc[roomName] = [];
    }
    acc[roomName].push(booking);
    return acc;
  }, {});
};

const AllBookingsView = ({ 
  bookings, 
  onDelete, 
  onEdit 
}: { 
  bookings: Booking[]; 
  onDelete: (id: number) => void; 
  onEdit: (id: number) => void; 
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

const RoomBookingsView = ({ 
  bookingsByRoom, 
  onDelete, 
  onEdit 
}: { 
  bookingsByRoom: BookingsByRoom; 
  onDelete: (id: number) => void; 
  onEdit: (id: number) => void; 
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

function getBookingCountText(count: number): string {
  const lastDigit = count % 10;
  const lastTwoDigits = count % 100;

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

const MonthlyRoomBookingsView = ({ 
  bookingsByRoom, 
  onDelete, 
  onEdit,
  onDaySelect
}: { 
  bookingsByRoom: BookingsByRoom; 
  onDelete: (id: number) => void; 
  onEdit: (id: number) => void;
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

  const groupBookingsByDay = (bookings: Booking[]) => {
    return bookings.reduce<Record<string, Booking[]>>((acc, booking) => {
      const dayKey = booking.booking_date.split('T')[0];
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
                        .sort((a, b) => {
                          const aTime = new Date(`${a.booking_date}T${a.start_time}`).getTime();
                          const bTime = new Date(`${b.booking_date}T${b.start_time}`).getTime();
                          return aTime - bTime;
                        })
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

const RoomFilter = ({ uniqueRooms, selectedRoom, setSelectedRoom }: { 
  uniqueRooms: string[];
  selectedRoom: string | null;
  setSelectedRoom: (room: string | null) => void;
}) => {
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

export default function BookingCalendarPage() {
  const cookies = new Cookies();
  const [date, setDate] = useState<Date>(new Date());
  const [view, setView] = useState<'month' | 'day'>('month');
  const [selectedDay, setSelectedDay] = useState<Date>(new Date());
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'all' | 'rooms'>('all');
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);

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
    
    return response.json();
  };

  const fetchData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch all data in parallel
      const [bookingsData, roomsData, packagesData] = await Promise.all([
        fetchWithAuth('http://localhost:89/api/bookings'),
        fetchWithAuth('http://localhost:89/api/rooms'),
        fetchWithAuth('http://localhost:89/api/packages')
      ]);

      // Enrich bookings with related data
      const enrichedBookings = bookingsData.map((booking: Booking) => ({
        ...booking,
        room: roomsData.find((room: Room) => room.id === booking.room_id),
        package: packagesData.find((pkg: Package) => pkg.id === booking.package_id)
      }));

      setBookings(enrichedBookings);
      setRooms(roomsData.filter((room: Room) => room.is_active && room.available));
      setPackages(packagesData.filter((pkg: Package) => pkg.is_active));
    } catch (error) {
      toast({
        title: "Ошибка загрузки",
        description: error instanceof Error ? error.message : "Не удалось загрузить данные",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const bookingsForMonth = useMemo(() => {
    return bookings.filter(booking => {
      const bookingDate = new Date(booking.booking_date);
      return (
        bookingDate.getMonth() === date.getMonth() && 
        bookingDate.getFullYear() === date.getFullYear()
      );
    });
  }, [bookings, date]);

  const bookingsForSelectedDay = useMemo(() => {
    return bookings.filter(booking => {
      const bookingDate = new Date(booking.booking_date);
      return isSameDay(bookingDate, selectedDay);
    });
  }, [bookings, selectedDay]);

  const bookingsByRoom = useMemo(() => groupBookingsByRoom(bookingsForSelectedDay), [bookingsForSelectedDay]);
  const bookingsByRoomMonth = useMemo(() => groupBookingsByRoom(bookingsForMonth), [bookingsForMonth]);

  const uniqueRooms = useMemo(() => {
    const roomNames = new Set<string>();
    bookings.forEach(booking => {
      if (booking.room) {
        roomNames.add(booking.room.name);
      }
    });
    return Array.from(roomNames);
  }, [bookings]);

  const filteredBookingsForMonth = useMemo(() => {
    if (!selectedRoom) return bookingsForMonth;
    return bookingsForMonth.filter(booking => booking.room?.name === selectedRoom);
  }, [bookingsForMonth, selectedRoom]);

  const filteredBookingsByRoomMonth = useMemo(() => {
    if (selectedRoom) {
      const filtered = bookingsForMonth.filter(booking => booking.room?.name === selectedRoom);
      return { [selectedRoom]: filtered };
    }
    return bookingsByRoomMonth;
  }, [bookingsForMonth, bookingsByRoomMonth, selectedRoom]);

  const totalGuests = bookingsForSelectedDay.reduce((sum, booking) => sum + booking.num_people, 0);
  const pendingBookings = bookingsForSelectedDay.filter(b => b.status === BookingStatus.PENDING).length;
  const confirmedBookings = bookingsForSelectedDay.filter(b => b.status === BookingStatus.CONFIRMED).length;
  const cancelledBookings = bookingsForSelectedDay.filter(b => b.status === BookingStatus.CANCELLED).length;
  const completedBookings = bookingsForSelectedDay.filter(b => b.status === BookingStatus.COMPLETED).length;

  const paidBookings = bookingsForSelectedDay.filter(b => b.payment_status === PaymentStatus.PAID).length;
  const unpaidBookings = bookingsForSelectedDay.filter(b => b.payment_status === PaymentStatus.PENDING).length;
  const partiallyPaidBookings = bookingsForSelectedDay.filter(b => b.payment_status === PaymentStatus.PARTIALLY_PAID).length;
  const failedBookings = bookingsForSelectedDay.filter(b => b.payment_status === PaymentStatus.FAILED).length;
  const refundedBookings = bookingsForSelectedDay.filter(b => b.payment_status === PaymentStatus.REFUNDED).length;

  const handleDeleteBooking = async (id: number) => {
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
  };

  const handleEditBooking = (id: number) => {
    // In a real app, this would redirect to the edit page
    toast({
      title: "Редактирование бронирования",
      description: `Редактирование бронирования с ID ${id}.`,
    });
  };

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

  const generateDaysForMonth = () => {
    return Array.from({ length: new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate() }, (_, i) => {
      const day = new Date(date.getFullYear(), date.getMonth(), i + 1);
      const bookingsForDay = bookingsForMonth.filter(booking => {
        const bookingDate = new Date(booking.booking_date);
        return bookingDate.getDate() === day.getDate();
      });
      return { day, bookings: bookingsForDay };
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Загрузка данных...</p>
      </div>
    );
  }

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
          <Button asChild>
            <Link href="/admin/bookings/add">
              <Plus className="mr-2 h-4 w-4" />
              Новое бронирование
            </Link>
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
                          isSelected={isSameDay(selectedDay, day)}
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
                        isSelected={isSameDay(selectedDay, day)}
                        onSelect={setSelectedDay}
                      />
                    </div>
                  );
                })}
              </div>
            </CardContent>
            <CardFooter className="bg-card/50 border-t border-border p-4">
              <div className="w-full grid grid-cols-4 gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span className="text-xs text-muted-foreground">Подтверждено</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <span className="text-xs text-muted-foreground">Ожидание</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <span className="text-xs text-muted-foreground">Отменено</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <span className="text-xs text-muted-foreground">Завершено</span>
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
                  <div className="text-muted-foreground text-xs mb-1">Подтверждено</div>
                  <div className="text-2xl font-bold text-green-500">{confirmedBookings}</div>
                </div>
                <div className="bg-card/50 rounded-lg p-3 border border-border">
                  <div className="text-muted-foreground text-xs mb-1">Ожидание</div>
                  <div className="text-2xl font-bold text-yellow-500">{pendingBookings}</div>
                </div>
                <div className="bg-card/50 rounded-lg p-3 border border-border">
                  <div className="text-muted-foreground text-xs mb-1">Отменено</div>
                  <div className="text-2xl font-bold text-red-500">{cancelledBookings}</div>
                </div>
                <div className="bg-card/50 rounded-lg p-3 border border-border">
                  <div className="text-muted-foreground text-xs mb-1">Завершено</div>
                  <div className="text-2xl font-bold text-blue-500">{completedBookings}</div>
                </div>
              </div>
              
              {bookingsForSelectedDay.length > 0 && (
                <div className="mt-4 pt-4 border-t border-border">
                  <div className="text-sm font-semibold text-white mb-2">Статусы оплаты</div>
                  <div className="space-y-2">
                    <div className="w-full h-2 bg-card/50 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-green-500 rounded-l-full" 
                        style={{ 
                          width: `${(paidBookings / bookingsForSelectedDay.length) * 100}%`,
                        }} 
                      />
                      <div 
                        className="h-full bg-blue-500" 
                        style={{ 
                          width: `${(partiallyPaidBookings / bookingsForSelectedDay.length) * 100}%`,
                        }} 
                      />
                      <div 
                        className="h-full bg-yellow-500" 
                        style={{ 
                          width: `${(unpaidBookings / bookingsForSelectedDay.length) * 100}%`,
                        }} 
                      />
                      <div 
                        className="h-full bg-red-500" 
                        style={{ 
                          width: `${(failedBookings / bookingsForSelectedDay.length) * 100}%`,
                        }} 
                      />
                      <div 
                        className="h-full bg-purple-500 rounded-r-full" 
                        style={{ 
                          width: `${(refundedBookings / bookingsForSelectedDay.length) * 100}%`,
                        }} 
                      />
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{paidBookings} оплачено</span>
                      <span>{partiallyPaidBookings} частично</span>
                      <span>{unpaidBookings} ожидание</span>
                      <span>{failedBookings} ошибка</span>
                      <span>{refundedBookings} возврат</span>
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
                  {view === 'month' ? (
                    <span>
                      Бронирования за {format(date, 'LLLL yyyy', { locale: pl })}
                    </span>
                  ) : (
                    <span>
                      Бронирования на {format(selectedDay, 'd MMMM yyyy', { locale: pl })}
                    </span>
                  )}
                </CardTitle>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/admin/bookings/add">
                    <Plus className="mr-2 h-4 w-4" />
                    Добавить
                  </Link>
                </Button>
              </div>
            </CardHeader>
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
                <TabsContent value="all" className="mt-0">
                  {view === 'month' ? (
                    <div className="space-y-4">
                      <RoomFilter 
                        uniqueRooms={uniqueRooms}
                        selectedRoom={selectedRoom}
                        setSelectedRoom={setSelectedRoom}
                      />
                      
                      {filteredBookingsForMonth.length > 0 ? (
                        Array.from({ length: new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate() }, (_, i) => {
                          const day = new Date(date.getFullYear(), date.getMonth(), i + 1);
                          const bookingsForDay = filteredBookingsForMonth.filter(booking => {
                            const bookingDate = new Date(booking.booking_date);
                            return isSameDay(bookingDate, day);
                          });
                          
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
                                  .sort((a, b) => {
                                    const aTime = new Date(`${a.booking_date}T${a.start_time}`).getTime();
                                    const bTime = new Date(`${b.booking_date}T${b.start_time}`).getTime();
                                    return aTime - bTime;
                                  })
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
                    <AllBookingsView 
                      bookings={bookingsForSelectedDay}
                      onDelete={handleDeleteBooking}
                      onEdit={handleEditBooking}
                    />
                  )}
                </TabsContent>
                
                <TabsContent value="rooms" className="mt-0">
                  {view === 'month' ? (
                    <div className="space-y-4">
                      <RoomFilter 
                        uniqueRooms={uniqueRooms}
                        selectedRoom={selectedRoom}
                        setSelectedRoom={setSelectedRoom}
                      />
                      
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
                    <RoomBookingsView 
                      bookingsByRoom={bookingsByRoom}
                      onDelete={handleDeleteBooking}
                      onEdit={handleEditBooking}
                    />
                  )}
                </TabsContent>
              </CardContent>
            </Tabs>
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