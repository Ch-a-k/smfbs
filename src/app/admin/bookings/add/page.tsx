'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { CalendarIcon, Check, User, Mail, Phone, Package, Clock, DoorOpen, CreditCard } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';

// Определяем пакеты услуг
const packages = [
  {
    id: 'trudny',
    name: 'TRUDNY',
    title: 'DO ZDEMOLOWANIA',
    items: '35 szklanych przedmiotów, 5 meble, 8 sprzętów RTV i AGD, 10 mniejszych sprzętów RTV i AGD',
    tools: 'ubranie, kask, rękawice',
    capacity: '1-6 osób/do 180 min',
    price: '999 PLN',
    isBestseller: false
  },
  {
    id: 'sredni',
    name: 'ŚREDNI',
    title: 'DO ZDEMOLOWANIA',
    items: '30 szklanych przedmiotów, 3 meble, 5 sprzętów RTV i AGD',
    tools: 'ubranie, kask, rękawice',
    capacity: '1-4 osób/do 120 min',
    price: '499 PLN',
    isBestseller: true
  },
  {
    id: 'latwy',
    name: 'ŁATWY',
    title: 'DO ZDEMOLOWANIA',
    items: '25 szklanych przedmiotów, 2 meble, 3 sprzęty RTV i AGD',
    tools: 'ubranie, kask, rękawice',
    capacity: '1-2 osób/do 45 min',
    price: '299 PLN',
    isBestseller: false
  },
  {
    id: 'bulka',
    name: 'BUŁKA Z MASŁEM',
    title: 'DO ZDEMOLOWANIA',
    items: '25 szklanych przedmiotów',
    tools: 'ubranie, kask, rękawice',
    capacity: '1-2 osób/do 30 min',
    price: '199 PLN',
    isBestseller: false
  }
];

// Определяем доступные комнаты
const rooms = [
  { id: 'room1', name: 'Комната 1' },
  { id: 'room2', name: 'Комната 2' },
  { id: 'room3', name: 'Комната 3' }
];

// Определяем доступные статусы оплаты
const paymentStatuses = [
  { id: 'paid', name: 'Полностью оплачен', color: 'success' },
  { id: 'deposit', name: 'Задаток', color: 'warning' },
  { id: 'unpaid', name: 'Не оплачен', color: 'destructive' }
];

// Определяем доступные часы для бронирования
const availableHours = Array.from({ length: 12 }, (_, i) => i + 9); // с 9:00 до 20:00

interface FormData {
  name: string;
  email: string;
  phone: string;
  packageId: string;
  date: Date | null;
  time: string;
  roomId: string;
  paymentStatus: string;
}

export default function AddBookingPage() {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    phone: '',
    packageId: '',
    date: null,
    time: '',
    roomId: '',
    paymentStatus: ''
  });
  const { toast } = useToast();

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Booking data:', formData);
    // Здесь будет логика отправки данных на сервер
    toast({
      title: "Успешно!",
      description: "Бронирование успешно добавлено",
      variant: "default",
    });
    setFormData({
      name: '',
      email: '',
      phone: '',
      packageId: '',
      date: null,
      time: '',
      roomId: '',
      paymentStatus: ''
    });
  };

  // Получение информации о выбранном пакете
  const selectedPackage = formData.packageId ? packages.find(pkg => pkg.id === formData.packageId) : null;

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
                    <Label htmlFor="name">Имя клиента</Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={(e) => handleChange('name', e.target.value)}
                      className="bg-background border-input"
                      required
                      aria-required="true"
                      aria-label="Имя клиента"
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
                      className="bg-background border-input"
                      required
                      aria-required="true"
                      aria-label="Email клиента"
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
                      className="bg-background border-input"
                      required
                      aria-required="true"
                      aria-label="Телефон клиента"
                      placeholder="+48 123 456 789"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="packageId">Пакет услуг</Label>
                    <Select 
                      name="packageId"
                      value={formData.packageId} 
                      onValueChange={(value) => handleChange('packageId', value)}
                      required
                    >
                      <SelectTrigger 
                        id="packageId"
                        className="bg-background border-input"
                        aria-label="Выберите пакет"
                      >
                        <SelectValue placeholder="Выберите пакет" />
                      </SelectTrigger>
                      <SelectContent>
                        {packages.map((pkg) => (
                          <SelectItem key={pkg.id} value={pkg.id}>
                            <div className="flex items-center justify-between w-full">
                              <span>{pkg.name}</span>
                              {pkg.isBestseller && (
                                <Badge variant="default" className="ml-2">BESTSELLER</Badge>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
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
                    <Label htmlFor="date">Дата бронирования</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          id="date"
                          variant="outline"
                          className={`w-full justify-start text-left font-normal ${!formData.date && 'text-muted-foreground'}`}
                          aria-label="Выберите дату"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4 text-primary" />
                          {formData.date ? format(formData.date, 'PPP') : 'Выберите дату'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={formData.date || undefined}
                          onSelect={(date) => handleChange('date', date)}
                          initialFocus
                          aria-label="Календарь для выбора даты"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="time">Время</Label>
                    <Select 
                      name="time"
                      value={formData.time} 
                      onValueChange={(value) => handleChange('time', value)}
                      required
                    >
                      <SelectTrigger 
                        id="time"
                        className="bg-background border-input"
                        aria-label="Выберите время"
                      >
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
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="bg-muted/30">
                <CardTitle className="flex items-center">
                  <DoorOpen className="mr-2 h-5 w-5 text-primary" />
                  Комната и оплата
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="roomId">Комната</Label>
                    <Select 
                      name="roomId"
                      value={formData.roomId} 
                      onValueChange={(value) => handleChange('roomId', value)}
                      required
                    >
                      <SelectTrigger 
                        id="roomId"
                        className="bg-background border-input"
                        aria-label="Выберите комнату"
                      >
                        <SelectValue placeholder="Выберите комнату" />
                      </SelectTrigger>
                      <SelectContent>
                        {rooms.map((room) => (
                          <SelectItem key={room.id} value={room.id}>
                            {room.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="paymentStatus">Статус оплаты</Label>
                    <RadioGroup 
                      value={formData.paymentStatus} 
                      onValueChange={(value) => handleChange('paymentStatus', value)}
                      className="flex flex-col space-y-1"
                      required
                    >
                      {paymentStatuses.map((status) => (
                        <div key={status.id} className="flex items-center space-x-2 rounded-md border p-2 hover:bg-muted/50 cursor-pointer">
                          <RadioGroupItem value={status.id} id={`status-${status.id}`} />
                          <Label htmlFor={`status-${status.id}`} className="flex-grow cursor-pointer">
                            {status.name}
                          </Label>
                          <Badge variant={status.color as any}>{status.name}</Badge>
                        </div>
                      ))}
                    </RadioGroup>
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
                    {selectedPackage.isBestseller && (
                      <Badge className="bg-primary">BESTSELLER</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{selectedPackage.title}</p>
                  
                  <div className="border-t pt-4">
                    <h5 className="font-medium mb-2">Включено:</h5>
                    <p className="text-sm text-foreground">{selectedPackage.items}</p>
                  </div>
                  
                  <div className="border-t pt-4">
                    <h5 className="font-medium mb-2">Инструменты:</h5>
                    <p className="text-sm text-foreground">{selectedPackage.tools}</p>
                  </div>
                  
                  <div className="border-t pt-4">
                    <h5 className="font-medium mb-2">Вместимость:</h5>
                    <p className="text-sm text-foreground">{selectedPackage.capacity}</p>
                  </div>
                  
                  <div className="border-t pt-4">
                    <h5 className="font-medium mb-2">Стоимость:</h5>
                    <p className="text-xl font-bold text-primary">{selectedPackage.price}</p>
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
                    <span className="font-medium">{formData.date ? format(formData.date, 'dd.MM.yyyy') : '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Время:</span>
                    <span className="font-medium">{formData.time || '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Комната:</span>
                    <span className="font-medium">{formData.roomId ? rooms.find(r => r.id === formData.roomId)?.name : '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Статус оплаты:</span>
                    <span className="font-medium">
                      {formData.paymentStatus ? (
                        <Badge variant={paymentStatuses.find(s => s.id === formData.paymentStatus)?.color as any}>
                          {paymentStatuses.find(s => s.id === formData.paymentStatus)?.name}
                        </Badge>
                      ) : '—'}
                    </span>
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