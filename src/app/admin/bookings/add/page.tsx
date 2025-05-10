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
import { CalendarIcon, Check, User, Mail, Phone, Package, Clock, DoorOpen, CreditCard, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import Cookies from 'universal-cookie';

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
    notes: ''
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
        notes: formData.notes
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
        notes: ''
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
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="roomId">Комната</Label>
                    <Select 
                      value={formData.roomId?.toString() || ''}
                      onValueChange={(value) => handleChange('roomId', parseInt(value))}
                      required
                    >
                      <SelectTrigger id="roomId">
                        <SelectValue placeholder="Выберите комнату" />
                      </SelectTrigger>
                      <SelectContent>
                        {rooms.map((room) => (
                          <SelectItem key={room.id} value={room.id.toString()}>
                            {room.name} (до {room.max_people} чел.)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">Статус бронирования</Label>
                    <RadioGroup 
                      value={formData.status}
                      onValueChange={(value: BookingStatus) => handleChange('status', value)}
                      className="flex flex-col space-y-1"
                    >
                      {bookingStatusOptions.map((status) => (
                        <div key={status.id} className="flex items-center space-x-2 rounded-md border p-2 hover:bg-muted/50 cursor-pointer">
                          <RadioGroupItem value={status.id} id={`status-${status.id}`} />
                          <Label htmlFor={`status-${status.id}`} className="flex-grow cursor-pointer">
                            {status.name}
                          </Label>
                          <Badge variant={status.color}>{status.name}</Badge>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="paymentStatus">Статус оплаты</Label>
                    <RadioGroup 
                      value={formData.paymentStatus}
                      onValueChange={(value: PaymentStatus) => handleChange('paymentStatus', value)}
                      className="flex flex-col space-y-1"
                    >
                      {paymentStatusOptions.map((status) => (
                        <div key={status.id} className="flex items-center space-x-2 rounded-md border p-2 hover:bg-muted/50 cursor-pointer">
                          <RadioGroupItem value={status.id} id={`payment-${status.id}`} />
                          <Label htmlFor={`payment-${status.id}`} className="flex-grow cursor-pointer">
                            {status.name}
                          </Label>
                          <Badge variant={status.color}>{status.name}</Badge>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="notes">Примечания</Label>
                    <Input
                      id="notes"
                      name="notes"
                      value={formData.notes}
                      onChange={(e) => handleChange('notes', e.target.value)}
                      placeholder="Дополнительная информация"
                    />
                  </div>
                </div>
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