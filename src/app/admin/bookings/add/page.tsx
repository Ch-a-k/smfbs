'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format, addMinutes } from 'date-fns';
import { CalendarIcon, Check, User, Mail, Phone, Package, Clock, DoorOpen, CreditCard, Users, Wine, Keyboard, Tv, Sofa, Printer, Mouse, Camera } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import Cookies from 'universal-cookie';
import { Checkbox } from '@/components/ui/checkbox';

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

// Interfaces matching backend models
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

interface Room {
  id: number;
  name: string;
  capacity: number;
  max_people: number;
  is_active: boolean;
  available: boolean;
  notes?: string;
  work_schedule?: Record<string, any>;
}

interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string;
  is_vip: boolean;
}

interface StatusOption {
  id: BookingStatus | PaymentStatus;
  name: string;
  color: 'default' | 'destructive' | 'success' | 'warning' | 'info';
}

// Типы иконок для предметов
type ItemKey = 'glass' | 'keyboard' | 'tvMonitor' | 'furniture' | 'printer' | 'mouse' | 'phone' | 'goProRecording';

// Цены товаров
const ITEM_PRICES: Record<ItemKey, number> = {
  'glass': 50,        // 10 стеклянных предметов - 50 PLN
  'keyboard': 20,     // Клавиатура - 20 PLN
  'tvMonitor': 100,   // ТВ/монитор - 100 PLN
  'furniture': 120,   // Мебель - 120 PLN
  'printer': 50,      // Принтер - 50 PLN
  'mouse': 10,        // Компьютерная мышь - 10 PLN
  'phone': 30,        // Телефон - 30 PLN
  'goProRecording': 50 // GoPro запись - 50 PLN
};

// Иконки для каждого типа предмета
const getItemIcon = (itemKey: ItemKey) => {
  switch (itemKey) {
    case 'glass': return <Wine className="w-4 h-4" />;
    case 'keyboard': return <Keyboard className="w-4 h-4" />;
    case 'tvMonitor': return <Tv className="w-4 h-4" />;
    case 'furniture': return <Sofa className="w-4 h-4" />;
    case 'printer': return <Printer className="w-4 h-4" />;
    case 'mouse': return <Mouse className="w-4 h-4" />;
    case 'phone': return <Phone className="w-4 h-4" />;
    case 'goProRecording': return <Camera className="w-4 h-4" />;
  }
};

// Названия предметов
const ITEM_NAMES: Record<ItemKey, string> = {
  'glass': '10 стеклянных предметов',
  'keyboard': 'Клавиатура',
  'tvMonitor': 'ТВ/монитор',
  'furniture': 'Мебель',
  'printer': 'Принтер',
  'mouse': 'Компьютерная мышь',
  'phone': 'Телефон',
  'goProRecording': 'GoPro запись'
};

export default function AddBookingPage() {
  const cookies = new Cookies();
  const [packages, setPackages] = useState<Package[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const bookingStatusOptions: StatusOption[] = [
    { id: BookingStatus.PENDING, name: 'Ожидание', color: 'warning' },
    { id: BookingStatus.CONFIRMED, name: 'Подтверждено', color: 'success' },
    { id: BookingStatus.CANCELLED, name: 'Отменено', color: 'destructive' },
    { id: BookingStatus.COMPLETED, name: 'Завершено', color: 'default' }
  ];

  const paymentStatusOptions: StatusOption[] = [
    { id: PaymentStatus.PENDING, name: 'Ожидание оплаты', color: 'warning' },
    { id: PaymentStatus.PAID, name: 'Оплачено', color: 'success' },
    { id: PaymentStatus.PARTIALLY_PAID, name: 'Частично оплачено', color: 'info' },
    { id: PaymentStatus.FAILED, name: 'Ошибка оплаты', color: 'destructive' },
    { id: PaymentStatus.REFUNDED, name: 'Возврат', color: 'default' }
  ];

  const availableHours = Array.from({ length: 12 }, (_, i) => i + 9); // 9:00 to 20:00

  interface FormData {
    customerId: number | null;
    name: string;
    email: string;
    phone: string;
    packageId: number | null;
    bookingDate: Date | null;
    startTime: string;
    endTime: string;
    roomId: number | null;
    numPeople: number;
    status: BookingStatus;
    paymentStatus: PaymentStatus;
    totalPrice: number;
    paidAmount: number;
    notes: string;
    extraItems: Partial<Record<ItemKey, number>>;
  }

  const [formData, setFormData] = useState<FormData>({
    customerId: null,
    name: '',
    email: '',
    phone: '',
    packageId: null,
    bookingDate: null,
    startTime: '',
    endTime: '',
    roomId: null,
    numPeople: 1,
    status: BookingStatus.PENDING,
    paymentStatus: PaymentStatus.PENDING,
    totalPrice: 0,
    paidAmount: 0,
    notes: '',
    extraItems: {} as Partial<Record<ItemKey, number>>
  });

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
      
      // Fetch packages
      const packagesData = await fetchWithAuth('http://localhost:89/api/packages');
      setPackages(packagesData.filter((pkg: Package) => pkg.is_active));
      
      // Fetch rooms
      const roomsData = await fetchWithAuth('http://localhost:89/api/rooms');
      setRooms(roomsData.filter((room: Room) => room.is_active && room.available));
      
      // Fetch customers
      const customersData = await fetchWithAuth('http://localhost:89/api/customers');
      setCustomers(customersData);
      
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

  useEffect(() => {
    // Calculate end time when package or start time changes
    if (formData.packageId && formData.startTime) {
      const selectedPackage = packages.find(p => p.id === formData.packageId);
      if (selectedPackage) {
        const [hours, minutes] = formData.startTime.split(':').map(Number);
        const startDate = new Date();
        startDate.setHours(hours, minutes, 0, 0);
        const endDate = addMinutes(startDate, selectedPackage.duration);
        const endTime = format(endDate, 'HH:mm');
        
        setFormData(prev => ({
          ...prev,
          endTime,
          totalPrice: selectedPackage.price,
          paidAmount: selectedPackage.deposit_amount,
          numPeople: Math.min(prev.numPeople, selectedPackage.max_people)
        }));
      }
    }
  }, [formData.packageId, formData.startTime, packages]);

  useEffect(() => {
    // Calculate total price when extra items change
    const calculateTotalPrice = () => {
      let basePrice = 0;
      
      // Base price from package
      if (formData.packageId) {
        const selectedPackage = packages.find(p => p.id === formData.packageId);
        if (selectedPackage) {
          basePrice = selectedPackage.price;
        }
      }
      
      // Add extra items price
      const extraItemsPrice = Object.entries(formData.extraItems).reduce((total, [itemKey, quantity]) => {
        return total + ITEM_PRICES[itemKey as ItemKey] * quantity;
      }, 0);
      
      return basePrice + extraItemsPrice;
    };
    
    const totalPrice = calculateTotalPrice();
    setFormData(prev => ({ ...prev, totalPrice }));
  }, [formData.packageId, formData.extraItems, packages]);

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    if (field === 'customerId') {
      const selectedCustomer = customers.find(c => c.id === value);
      if (selectedCustomer) {
        setFormData(prev => ({
          ...prev,
          name: selectedCustomer.name,
          email: selectedCustomer.email,
          phone: selectedCustomer.phone
        }));
      }
    }

    if (field === 'packageId') {
      const selectedPackage = packages.find(p => p.id === value);
      if (selectedPackage) {
        setFormData(prev => ({
          ...prev,
          totalPrice: selectedPackage.price,
          paidAmount: selectedPackage.deposit_amount,
          numPeople: Math.min(prev.numPeople, selectedPackage.max_people)
        }));
      }
    }

    if (field === 'numPeople') {
      const num = parseInt(value) || 1;
      if (formData.packageId) {
        const selectedPackage = packages.find(p => p.id === formData.packageId);
        if (selectedPackage) {
          setFormData(prev => ({
            ...prev,
            numPeople: Math.min(num, selectedPackage.max_people)
          }));
          return;
        }
      }
      setFormData(prev => ({ ...prev, numPeople: num }));
    }
  };

  const toggleExtraItem = (itemKey: ItemKey) => {
    setFormData(prev => {
      const newExtraItems = { ...prev.extraItems };
      
      if (newExtraItems[itemKey]) {
        delete newExtraItems[itemKey];
      } else {
        newExtraItems[itemKey] = 1;
      }
      
      return { 
        ...prev, 
        extraItems: newExtraItems,
      };
    });
  };

  const changeItemQuantity = (itemKey: ItemKey, quantity: number) => {
    if (quantity <= 0) {
      setFormData(prev => {
        const newExtraItems = { ...prev.extraItems };
        delete newExtraItems[itemKey];
        return { ...prev, extraItems: newExtraItems };
      });
    } else {
      setFormData(prev => ({
        ...prev,
        extraItems: {
          ...prev.extraItems,
          [itemKey]: quantity
        }
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const bookingData = {
        room_id: formData.roomId,
        package_id: formData.packageId,
        customer_name: formData.name,
        customer_email: formData.email,
        customer_phone: formData.phone,
        booking_date: formData.bookingDate?.toISOString().split('T')[0],
        start_time: formData.startTime,
        end_time: formData.endTime,
        num_people: formData.numPeople,
        status: formData.status,
        total_price: formData.totalPrice,
        payment_status: formData.paymentStatus,
        paid_amount: formData.paidAmount,
        notes: formData.notes,
        extra_items: Object.entries(formData.extraItems).map(([itemKey, quantity]) => ({
          id: itemKey,
          name: ITEM_NAMES[itemKey as ItemKey],
          price: ITEM_PRICES[itemKey as ItemKey] * quantity,
          quantity: quantity
        })),
      };

      await fetchWithAuth('http://localhost:89/api/bookings', {
        method: 'POST',
        body: JSON.stringify(bookingData)
      });
      
      toast({
        title: "Успешно!",
        description: "Бронирование успешно добавлено",
        variant: "default",
      });
      
      // Reset form
      setFormData({
        customerId: null,
        name: '',
        email: '',
        phone: '',
        packageId: null,
        bookingDate: null,
        startTime: '',
        endTime: '',
        roomId: null,
        numPeople: 1,
        status: BookingStatus.PENDING,
        paymentStatus: PaymentStatus.PENDING,
        totalPrice: 0,
        paidAmount: 0,
        notes: '',
        extraItems: {} as Partial<Record<ItemKey, number>>
      });
      
    } catch (error) {
      toast({
        title: "Ошибка",
        description: error instanceof Error ? error.message : "Не удалось создать бронирование",
        variant: "destructive",
      });
    }
  };

  const selectedPackage = formData.packageId ? packages.find(pkg => pkg.id === formData.packageId) : null;
  const selectedRoom = formData.roomId ? rooms.find(room => room.id === formData.roomId) : null;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Загрузка данных...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Добавление бронирования</h2>
        <p className="text-muted-foreground">
          Заполните форму для создания нового бронирования
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="space-y-6">
            <Card>
              <CardHeader className="bg-muted/30">
                <CardTitle className="flex items-center">
                  <User className="mr-2 h-5 w-5 text-primary" />
                  Информация о клиенте
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="customerId">Выбрать клиента</Label>
                    <Select 
                      value={formData.customerId?.toString() || ''}
                      onValueChange={(value) => handleChange('customerId', parseInt(value))}
                    >
                      <SelectTrigger id="customerId" className="bg-background border-input">
                        <SelectValue placeholder="Выберите клиента" />
                      </SelectTrigger>
                      <SelectContent>
                        {customers.map((customer) => (
                          <SelectItem key={customer.id} value={customer.id.toString()}>
                            {customer.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="name">Имя клиента</Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={(e) => handleChange('name', e.target.value)}
                      required
                      placeholder="Введите имя клиента"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                      required
                      placeholder="example@mail.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Телефон</Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleChange('phone', e.target.value)}
                      required
                      placeholder="+48 123 456 789"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="bg-muted/30">
                <CardTitle className="flex items-center">
                  <Package className="mr-2 h-5 w-5 text-primary" />
                  Пакет услуг
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="packageId">Пакет услуг</Label>
                    <Select 
                      value={formData.packageId?.toString() || ''}
                      onValueChange={(value) => handleChange('packageId', parseInt(value))}
                      required
                    >
                      <SelectTrigger id="packageId">
                        <SelectValue placeholder="Выберите пакет" />
                      </SelectTrigger>
                      <SelectContent>
                        {packages.map((pkg) => (
                          <SelectItem key={pkg.id} value={pkg.id.toString()}>
                            <div className="flex items-center justify-between w-full">
                              <span>{pkg.name}</span>
                              {pkg.is_best_seller && (
                                <Badge variant="default" className="ml-2">BESTSELLER</Badge>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {selectedPackage && (
                    <div className="space-y-2">
                      <Label htmlFor="numPeople">Количество человек</Label>
                      <Input
                        id="numPeople"
                        name="numPeople"
                        type="number"
                        min={1}
                        max={selectedPackage.max_people}
                        value={formData.numPeople}
                        onChange={(e) => handleChange('numPeople', e.target.value)}
                        required
                      />
                      <p className="text-sm text-muted-foreground">
                        Максимум: {selectedPackage.max_people} человек
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="bg-muted/30">
                <CardTitle className="flex items-center">
                  <Clock className="mr-2 h-5 w-5 text-primary" />
                  Дата и время
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="bookingDate">Дата бронирования</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          id="bookingDate"
                          variant="outline"
                          className={`w-full justify-start text-left font-normal ${!formData.bookingDate && 'text-muted-foreground'}`}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4 text-primary" />
                          {formData.bookingDate ? format(formData.bookingDate, 'PPP') : 'Выберите дату'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={formData.bookingDate || undefined}
                          onSelect={(date) => handleChange('bookingDate', date)}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="startTime">Время начала</Label>
                    <Select 
                      value={formData.startTime}
                      onValueChange={(value) => handleChange('startTime', value)}
                      required
                    >
                      <SelectTrigger id="startTime">
                        <SelectValue placeholder="Выберите время" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableHours.map((hour) => (
                          <SelectItem key={hour} value={`${hour}:00`}>
                            {`${hour}:00`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endTime">Время окончания</Label>
                    <Input
                      id="endTime"
                      name="endTime"
                      value={formData.endTime}
                      readOnly
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="bg-muted/30">
                <CardTitle className="flex items-center">
                  <DoorOpen className="mr-2 h-5 w-5 text-primary" />
                  Комната и статусы
                </CardTitle>
                <CardDescription>
                  Выберите комнату и установите статусы бронирования
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 gap-6">
                  {/* Выбор комнаты */}
                  <div className="border rounded-lg p-4 bg-muted/10">
                    <h3 className="text-md font-medium mb-3 flex items-center">
                      <DoorOpen className="mr-2 h-4 w-4 text-primary" />
                      Комната
                    </h3>
                    <div className="space-y-4">
                      <Select 
                        value={formData.roomId?.toString() || ''}
                        onValueChange={(value) => handleChange('roomId', parseInt(value))}
                        required
                      >
                        <SelectTrigger id="roomId" className="w-full">
                          <SelectValue placeholder="Выберите комнату" />
                        </SelectTrigger>
                        <SelectContent>
                          {rooms.map((room) => (
                            <SelectItem key={room.id} value={room.id.toString()}>
                              <div className="flex justify-between items-center w-full">
                                <span>{room.name}</span>
                                <span className="text-xs text-muted-foreground">
                                  до {room.max_people} чел.
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      
                      {selectedRoom && (
                        <div className="space-y-3 mt-2">
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div className="flex items-center">
                              <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                              <span>Вместимость: {selectedRoom.capacity}</span>
                            </div>
                            <div className="flex items-center">
                              <Badge variant={selectedRoom.available ? "success" : "destructive"}>
                                {selectedRoom.available ? "Доступна" : "Недоступна"}
                              </Badge>
                            </div>
                          </div>
                          
                          {selectedRoom.notes && (
                            <div className="text-sm border-t pt-2 mt-2">
                              <span className="font-medium">Примечания:</span> 
                              <p className="text-muted-foreground">{selectedRoom.notes}</p>
                            </div>
                          )}
                          
                          {selectedRoom.work_schedule && (
                            <div className="text-xs border-t pt-2 mt-2">
                              <span className="font-medium">Расписание работы:</span>
                              <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-1">
                                {Object.entries(selectedRoom.work_schedule).map(([day, schedule]: [string, any]) => (
                                  schedule && schedule.isActive && (
                                    <div key={day} className="flex justify-between">
                                      <span className="capitalize">{day}:</span>
                                      <span>{schedule.startTime} - {schedule.endTime}</span>
                                    </div>
                                  )
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Статусы */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Статус бронирования */}
                    <div className="border rounded-lg p-4 bg-muted/10">
                      <h3 className="text-md font-medium mb-3">Статус бронирования</h3>
                      <Select 
                        value={formData.status}
                        onValueChange={(value: BookingStatus) => handleChange('status', value)}
                      >
                        <SelectTrigger id="status" className="w-full">
                          <SelectValue placeholder="Выберите статус" />
                        </SelectTrigger>
                        <SelectContent>
                          {bookingStatusOptions.map((status) => (
                            <SelectItem key={status.id} value={status.id}>
                              <div className="flex items-center">
                                <Badge variant={status.color} className="mr-2">
                                  {status.name}
                                </Badge>
                                <span>{status.name}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      
                      <div className="mt-4">
                        <h4 className="text-sm font-medium mb-2">Текущий статус:</h4>
                        <Badge 
                          variant={bookingStatusOptions.find(s => s.id === formData.status)?.color || 'default'}
                          className="w-full justify-center py-1 text-sm"
                        >
                          {bookingStatusOptions.find(s => s.id === formData.status)?.name || 'Не выбран'}
                        </Badge>
                      </div>
                    </div>
                    
                    {/* Статус оплаты */}
                    <div className="border rounded-lg p-4 bg-muted/10">
                      <h3 className="text-md font-medium mb-3">Статус оплаты</h3>
                      <Select 
                        value={formData.paymentStatus}
                        onValueChange={(value: PaymentStatus) => handleChange('paymentStatus', value)}
                      >
                        <SelectTrigger id="paymentStatus" className="w-full">
                          <SelectValue placeholder="Выберите статус оплаты" />
                        </SelectTrigger>
                        <SelectContent>
                          {paymentStatusOptions.map((status) => (
                            <SelectItem key={status.id} value={status.id}>
                              <div className="flex items-center">
                                <Badge variant={status.color} className="mr-2">
                                  {status.name}
                                </Badge>
                                <span>{status.name}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      
                      <div className="mt-4">
                        <h4 className="text-sm font-medium mb-2">Текущий статус оплаты:</h4>
                        <Badge 
                          variant={paymentStatusOptions.find(s => s.id === formData.paymentStatus)?.color || 'default'}
                          className="w-full justify-center py-1 text-sm"
                        >
                          {paymentStatusOptions.find(s => s.id === formData.paymentStatus)?.name || 'Не выбран'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  {/* Информация об оплате */}
                  <div className="border rounded-lg p-4 bg-muted/10">
                    <h3 className="text-md font-medium mb-3 flex items-center">
                      <CreditCard className="mr-2 h-4 w-4 text-primary" />
                      Информация об оплате
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="totalPrice">Общая сумма (PLN)</Label>
                        <Input
                          id="totalPrice"
                          name="totalPrice"
                          type="number"
                          min="0"
                          value={formData.totalPrice}
                          onChange={(e) => handleChange('totalPrice', parseFloat(e.target.value))}
                          required
                        />
                        {selectedPackage && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Базовая стоимость пакета: {selectedPackage.price} PLN
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="paidAmount">Оплачено (PLN)</Label>
                        <Input
                          id="paidAmount"
                          name="paidAmount"
                          type="number"
                          min="0"
                          value={formData.paidAmount}
                          onChange={(e) => handleChange('paidAmount', parseFloat(e.target.value))}
                          required
                        />
                        {selectedPackage && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Рекомендуемый задаток: {selectedPackage.deposit_amount} PLN
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Индикатор прогресса оплаты */}
                    {formData.totalPrice > 0 && (
                      <div className="mt-4">
                        <div className="flex justify-between text-sm mb-1">
                          <span>Прогресс оплаты:</span>
                          <span>
                            {formData.paidAmount} / {formData.totalPrice} PLN 
                            ({Math.round((formData.paidAmount / formData.totalPrice) * 100)}%)
                          </span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2.5">
                          <div 
                            className={`h-2.5 rounded-full ${
                              formData.paidAmount >= formData.totalPrice 
                                ? 'bg-green-500' 
                                : formData.paidAmount > 0 
                                  ? 'bg-amber-500' 
                                  : 'bg-red-500'
                            }`}
                            style={{ width: `${Math.min(100, Math.round((formData.paidAmount / formData.totalPrice) * 100))}%` }}
                          ></div>
                        </div>
                        <div className="flex justify-between mt-2">
                          <div className="text-xs">
                            {formData.paidAmount <= 0 && <span className="text-red-500">Не оплачено</span>}
                            {formData.paidAmount > 0 && formData.paidAmount < formData.totalPrice && (
                              <span className="text-amber-500">
                                Частично оплачено (осталось {(formData.totalPrice - formData.paidAmount).toFixed(2)} PLN)
                              </span>
                            )}
                            {formData.paidAmount >= formData.totalPrice && <span className="text-green-500">Полностью оплачено</span>}
                          </div>
                          {formData.paymentStatus && (
                            <Badge 
                              variant={paymentStatusOptions.find(s => s.id === formData.paymentStatus)?.color || 'default'}
                            >
                              {paymentStatusOptions.find(s => s.id === formData.paymentStatus)?.name}
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Примечания */}
                  <div className="border rounded-lg p-4 bg-muted/10">
                    <h3 className="text-md font-medium mb-2 flex items-center">
                      <Mail className="mr-2 h-4 w-4 text-primary" />
                      Примечания
                    </h3>
                    <p className="text-xs text-muted-foreground mb-3">
                      Добавьте важную информацию о бронировании, особые пожелания клиента или другие заметки для персонала
                    </p>
                    <div className="space-y-2">
                      <div className="relative">
                        <textarea
                          id="notes"
                          name="notes"
                          value={formData.notes}
                          onChange={(e) => handleChange('notes', e.target.value)}
                          placeholder="Например: Клиент запросил особое расположение мебели, нужны дополнительные стулья, аллергия на определенные материалы и т.д."
                          className="w-full min-h-[120px] px-3 py-2 rounded-md border border-input bg-background text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        />
                        <div className="absolute bottom-2 right-2 text-xs text-muted-foreground">
                          {formData.notes.length} символов
                        </div>
                      </div>
                      
                      {formData.notes && (
                        <div className="mt-3 p-3 bg-muted/30 rounded-md border">
                          <h4 className="text-sm font-medium mb-1">Предпросмотр:</h4>
                          <div className="text-sm whitespace-pre-wrap">
                            {formData.notes}
                          </div>
                        </div>
                      )}
                      
                      <div className="flex flex-wrap gap-2 mt-2">
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleChange('notes', formData.notes + (formData.notes ? '\n' : '') + '• Особые пожелания: ')}
                        >
                          + Особые пожелания
                        </Button>
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleChange('notes', formData.notes + (formData.notes ? '\n' : '') + '• Аллергия: ')}
                        >
                          + Аллергия
                        </Button>
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleChange('notes', formData.notes + (formData.notes ? '\n' : '') + '• Контакт: ')}
                        >
                          + Контакт
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Дополнительные предметы */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Дополнительные предметы
                </CardTitle>
                <CardDescription>
                  Выберите дополнительные предметы, которые клиент хочет включить в заказ
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-4 mb-4 ">
                  {(Object.keys(ITEM_PRICES) as ItemKey[]).map((itemKey) => (
                    <div 
                      key={itemKey}
                      className={`
                        flex items-center space-x-3 p-3 rounded-md cursor-pointer hover:bg-muted/90
                        ${itemKey in formData.extraItems ? 'bg-slate-100 border-slate-200 border' : 'bg-muted/30 border-slate-100 border'}
                      `}
                      onClick={() => toggleExtraItem(itemKey)}
                    >
                      <div className="flex items-center">
                        <Checkbox
                          checked={itemKey in formData.extraItems}
                          onCheckedChange={() => toggleExtraItem(itemKey)}
                          id={`item-${itemKey}`}
                        />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center">
                          <div className="mr-2 text-orange-500">
                            {getItemIcon(itemKey)}
                          </div>
                          <Label
                            htmlFor={`item-${itemKey}`}
                            className="font-medium cursor-pointer"
                          >
                            {ITEM_NAMES[itemKey]}
                          </Label>
                        </div>
                        <div className="text-sm text-slate-500 ml-6">
                          {ITEM_PRICES[itemKey]} PLN
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {Object.keys(formData.extraItems).length > 0 && (
                  <div className="mt-4 pt-3 border-t border-slate-200">
                    <div className="text-sm font-medium">Выбранные предметы:</div>
                    <div className="mt-2 space-y-1">
                      {Object.entries(formData.extraItems).map(([itemKey, quantity]) => (
                        <div key={itemKey} className="flex justify-between items-center text-sm py-2">
                          <span className="flex items-center gap-2">
                            <span className="text-orange-500">{getItemIcon(itemKey as ItemKey)}</span>
                            {ITEM_NAMES[itemKey as ItemKey]}
                          </span>
                          <div className="flex items-center gap-2">
                            <div className="flex items-center border rounded-md">
                              <button 
                                type="button"
                                className="px-2 py-1 hover:bg-slate-100" 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  changeItemQuantity(itemKey as ItemKey, quantity - 1);
                                }}
                              >
                                -
                              </button>
                              <span className="px-3">{quantity}</span>
                              <button 
                                type="button"
                                className="px-2 py-1 hover:bg-slate-100" 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  changeItemQuantity(itemKey as ItemKey, quantity + 1);
                                }}
                              >
                                +
                              </button>
                            </div>
                            <span className="font-medium w-20 text-right">
                              {ITEM_PRICES[itemKey as ItemKey] * quantity} PLN
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-200 font-medium">
                      <span>Дополнительно:</span>
                      <span className="text-orange-600">
                        +{Object.entries(formData.extraItems).reduce((sum, [itemKey, quantity]) => 
                          sum + ITEM_PRICES[itemKey as ItemKey] * quantity, 0)} PLN
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Button type="submit" className="w-full" size="lg">
              <Check className="mr-2 h-4 w-4" /> Добавить бронирование
            </Button>
          </form>
        </div>

        <div className="lg:col-span-1">
          <Card>
            <CardHeader className="bg-muted/30">
              <CardTitle className="flex items-center">
                <Package className="mr-2 h-5 w-5 text-primary" />
                Информация о бронировании
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              {selectedPackage ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-lg font-semibold text-primary">{selectedPackage.name}</h4>
                    {selectedPackage.is_best_seller && (
                      <Badge className="bg-primary">BESTSELLER</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{selectedPackage.description}</p>
                  
                  <div className="border-t pt-4">
                    <h5 className="font-medium mb-2">Длительность:</h5>
                    <p className="text-sm text-foreground">{selectedPackage.duration} минут</p>
                  </div>
                  
                  <div className="border-t pt-4">
                    <h5 className="font-medium mb-2">Вместимость:</h5>
                    <p className="text-sm text-foreground">До {selectedPackage.max_people} человек</p>
                  </div>
                  
                  <div className="border-t pt-4">
                    <h5 className="font-medium mb-2">Стоимость:</h5>
                    <p className="text-xl font-bold text-primary">{selectedPackage.price} PLN</p>
                  </div>
                  
                  <div className="border-t pt-4">
                    <h5 className="font-medium mb-2">Задаток:</h5>
                    <p className="text-lg text-foreground">{selectedPackage.deposit_amount} PLN</p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Выберите пакет услуг для просмотра информации</p>
                </div>
              )}
            </CardContent>
          </Card>
          
          <div className="mt-6">
            <Card>
              <CardHeader className="bg-muted/30">
                <CardTitle className="flex items-center">
                  <CreditCard className="mr-2 h-5 w-5 text-primary" />
                  Сводка
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Клиент:</span>
                    <span className="font-medium">{formData.name || '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Пакет:</span>
                    <span className="font-medium">{selectedPackage?.name || '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Дата:</span>
                    <span className="font-medium">{formData.bookingDate ? format(formData.bookingDate, 'dd.MM.yyyy') : '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Время:</span>
                    <span className="font-medium">
                      {formData.startTime || '—'} - {formData.endTime || '—'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Комната:</span>
                    <span className="font-medium">{selectedRoom?.name || '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Кол-во человек:</span>
                    <span className="font-medium">{formData.numPeople}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Статус:</span>
                    <span className="font-medium">
                      <Badge variant={
                        bookingStatusOptions.find(s => s.id === formData.status)?.color || 'default'
                      }>
                        {bookingStatusOptions.find(s => s.id === formData.status)?.name}
                      </Badge>
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Оплата:</span>
                    <span className="font-medium">
                      <Badge variant={
                        paymentStatusOptions.find(s => s.id === formData.paymentStatus)?.color || 'default'
                      }>
                        {paymentStatusOptions.find(s => s.id === formData.paymentStatus)?.name}
                      </Badge>
                    </span>
                  </div>
                  <div className="border-t pt-4">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Итого:</span>
                      <span className="font-bold text-lg">{formData.totalPrice} PLN</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Оплачено:</span>
                      <span className="font-medium">{formData.paidAmount} PLN</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}