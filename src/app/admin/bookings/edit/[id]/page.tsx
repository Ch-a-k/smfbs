'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { useRouter } from 'next/navigation';
import Cookies from 'universal-cookie';
import { Checkbox } from '@/components/ui/checkbox';
import { Check, Package, Loader2 } from 'lucide-react';

// Типы для предметов (такие же как и в странице добавления бронирования)
type ItemKey = 'glass' | 'keyboard' | 'tvMonitor' | 'furniture' | 'printer' | 'mouse' | 'phone' | 'goProRecording';

// Статусы бронирования (такие же как и в странице добавления бронирования)
enum BookingStatus {
  PENDING = "pending",
  CONFIRMED = "confirmed",
  CANCELLED = "cancelled",
  COMPLETED = "completed"
}

// Статусы оплаты (такие же как и в странице добавления бронирования)
enum PaymentStatus {
  PENDING = "pending",
  PAID = "paid",
  PARTIALLY_PAID = "partially_paid",
  FAILED = "failed",
  REFUNDED = "refunded"
}

// Интерфейс для данных формы
interface FormData {
  id: number;
  customerId: number | null;
  name: string;
  email: string;
  phone: string;
  packageId: number | null;
  bookingDate: string | null;
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

export default function EditBookingPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { toast } = useToast();
  const cookies = new Cookies();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<FormData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Функция для загрузки данных бронирования
  const fetchBooking = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`http://localhost:89/api/booking/${params.id}`, {
        headers: {
          'Authorization': `Bearer ${cookies.get('access_token')}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Не удалось загрузить данные бронирования');
      }

      const bookingsData = await response.json();
      // API возвращает массив, нам нужен первый элемент
      const bookingData = Array.isArray(bookingsData) && bookingsData.length > 0 
        ? bookingsData[0] 
        : null;
        
      if (!bookingData) {
        throw new Error('Бронирование не найдено');
      }
      
      // Преобразуем дополнительные предметы в формат Record<ItemKey, number>
      const extraItemsRecord: Partial<Record<ItemKey, number>> = {};
      if (bookingData.extra_items && Array.isArray(bookingData.extra_items)) {
        bookingData.extra_items.forEach((item: any) => {
          if (item.id) {
            extraItemsRecord[item.id as ItemKey] = item.quantity || 1;
          }
        });
      }
      
      // Преобразуем полученные данные в формат формы
      setFormData({
        id: bookingData.id,
        customerId: bookingData.customer_id || null,
        name: bookingData.customer_name || '',
        email: bookingData.customer_email || '',
        phone: bookingData.customer_phone || '',
        packageId: bookingData.package_id || null,
        bookingDate: bookingData.booking_date || null,
        startTime: bookingData.start_time || '',
        endTime: bookingData.end_time || '',
        roomId: bookingData.room_id || null,
        numPeople: bookingData.num_people || 1,
        status: bookingData.status as BookingStatus || BookingStatus.PENDING,
        paymentStatus: bookingData.payment_status as PaymentStatus || PaymentStatus.PENDING,
        totalPrice: bookingData.total_price || 0,
        paidAmount: bookingData.paid_amount || 0,
        notes: bookingData.notes || '',
        extraItems: extraItemsRecord
      });
    } catch (error) {
      console.error('Ошибка при загрузке бронирования:', error);
      setError(error instanceof Error ? error.message : 'Произошла ошибка при загрузке данных');
    } finally {
      setIsLoading(false);
    }
  };

  // Функция для сохранения бронирования
  const saveBooking = async () => {
    if (!formData) return;
    
    try {
      setIsSaving(true);
      setError(null);

      // Создаем объект с данными для отправки на сервер
      const bookingData = {
        id: formData.id,
        customer_name: formData.name,
        customer_email: formData.email,
        customer_phone: formData.phone,
        package_id: formData.packageId,
        booking_date: formData.bookingDate,
        start_time: formData.startTime,
        end_time: formData.endTime,
        room_id: formData.roomId,
        num_people: formData.numPeople,
        status: formData.status,
        payment_status: formData.paymentStatus,
        total_price: formData.totalPrice,
        paid_amount: formData.paidAmount,
        notes: formData.notes,
        extra_items: Object.entries(formData.extraItems).map(([itemKey, quantity]) => ({
          id: itemKey,
          name: getItemName(itemKey as ItemKey),
          price: getItemPrice(itemKey as ItemKey) * quantity,
          quantity: quantity
        }))
      };

      const response = await fetch(`http://localhost:89/api/bookings`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${cookies.get('access_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(bookingData),
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Не удалось сохранить бронирование');
      }

      toast({
        title: 'Успешно',
        description: 'Бронирование успешно обновлено',
        variant: 'default'
      });

      // Перенаправляем пользователя на страницу списка бронирований
      router.push('/admin/bookings');
    } catch (error) {
      console.error('Ошибка при сохранении бронирования:', error);
      setError(error instanceof Error ? error.message : 'Произошла ошибка при сохранении данных');
      
      toast({
        title: 'Ошибка',
        description: error instanceof Error ? error.message : 'Произошла ошибка при сохранении данных',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Функция для получения названия предмета по его ID
  const getItemName = (id: ItemKey): string => {
    const names: Record<ItemKey, string> = {
      'glass': '10 стеклянных предметов',
      'keyboard': 'Клавиатура',
      'tvMonitor': 'ТВ/монитор',
      'furniture': 'Мебель',
      'printer': 'Принтер',
      'mouse': 'Компьютерная мышь',
      'phone': 'Телефон',
      'goProRecording': 'GoPro запись'
    };
    return names[id] || id;
  };

  // Функция для получения цены предмета по его ID
  const getItemPrice = (id: ItemKey): number => {
    const prices: Record<ItemKey, number> = {
      'glass': 50,
      'keyboard': 20,
      'tvMonitor': 100,
      'furniture': 120,
      'printer': 50,
      'mouse': 10,
      'phone': 30,
      'goProRecording': 50
    };
    return prices[id] || 0;
  };

  // Функция для изменения полей формы
  const handleChange = (field: keyof FormData, value: any) => {
    if (!formData) return;
    
    setFormData({
      ...formData,
      [field]: value
    });
  };

  // Функция для переключения выбранных дополнительных предметов
  const toggleExtraItem = (itemKey: ItemKey) => {
    if (!formData) return;
    
    const newExtraItems = { ...formData.extraItems };
    
    if (itemKey in newExtraItems) {
      delete newExtraItems[itemKey];
    } else {
      newExtraItems[itemKey] = 1; // По умолчанию добавляем 1 единицу товара
    }
    
    // Пересчитываем общую стоимость
    const extraItemsPrice = Object.entries(newExtraItems).reduce((total, [key, quantity]) => {
      return total + getItemPrice(key as ItemKey) * quantity;
    }, 0);
    
    // Базовая цена (без дополнительных предметов)
    const basePrice = formData.totalPrice - Object.entries(formData.extraItems).reduce((total, [key, quantity]) => {
      return total + getItemPrice(key as ItemKey) * quantity;
    }, 0);
    
    setFormData({
      ...formData,
      extraItems: newExtraItems,
      totalPrice: basePrice + extraItemsPrice
    });
  };

  // Функция для изменения количества предметов
  const changeItemQuantity = (itemKey: ItemKey, quantity: number) => {
    if (!formData) return;
    
    if (quantity <= 0) {
      // Если количество 0 или меньше, удаляем элемент
      const newExtraItems = { ...formData.extraItems };
      delete newExtraItems[itemKey];
      
      // Пересчитываем общую стоимость
      const extraItemsPrice = Object.entries(newExtraItems).reduce((total, [key, qty]) => {
        return total + getItemPrice(key as ItemKey) * qty;
      }, 0);
      
      // Базовая цена (без дополнительных предметов)
      const basePrice = formData.totalPrice - Object.entries(formData.extraItems).reduce((total, [key, qty]) => {
        return total + getItemPrice(key as ItemKey) * qty;
      }, 0);
      
      setFormData({
        ...formData,
        extraItems: newExtraItems,
        totalPrice: basePrice + extraItemsPrice
      });
    } else {
      // Иначе обновляем количество
      const oldQuantity = formData.extraItems[itemKey] || 0;
      const newExtraItems = { ...formData.extraItems, [itemKey]: quantity };
      
      // Пересчитываем общую стоимость
      const priceDifference = getItemPrice(itemKey) * (quantity - oldQuantity);
      
      setFormData({
        ...formData,
        extraItems: newExtraItems,
        totalPrice: formData.totalPrice + priceDifference
      });
    }
  };

  // Загружаем данные бронирования при монтировании компонента
  useEffect(() => {
    fetchBooking();
  }, [params.id]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="flex flex-col items-center">
          <Loader2 className="h-8 w-8 text-primary animate-spin mb-2" />
          <p>Загрузка данных бронирования...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Ошибка</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error}</p>
            <Button className="mt-4" onClick={() => router.push('/admin/bookings')}>
              Вернуться к списку бронирований
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!formData) {
    return (
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle>Бронирование не найдено</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Не удалось найти бронирование с ID: {params.id}</p>
            <Button className="mt-4" onClick={() => router.push('/admin/bookings')}>
              Вернуться к списку бронирований
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Редактирование бронирования</h2>
          <p className="text-muted-foreground">
            ID: {params.id} | Клиент: {formData.name}
          </p>
        </div>
        <div className="flex gap-2">
          <Button className="border border-[#3a3637] bg-transparent text-[#e0e0e0] hover:bg-[#3a3637]/50 hover:text-white" onClick={() => router.push('/admin/bookings')}>
            Отмена
          </Button>
          <Button onClick={saveBooking} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Сохранение...
              </>
            ) : (
              <>
                <Check className="mr-2 h-4 w-4" />
                Сохранить изменения
              </>
            )}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Основная информация</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Имя клиента</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email клиента</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Телефон клиента</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="numPeople">Количество человек</Label>
              <Input
                id="numPeople"
                type="number"
                min="1"
                value={formData.numPeople}
                onChange={(e) => handleChange('numPeople', parseInt(e.target.value))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Дополнительные предметы</CardTitle>
          <CardDescription>
            Выберите дополнительные предметы, которые клиент хочет добавить к заказу
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {(Object.keys(getItemPrice({} as any)) as ItemKey[]).map((itemKey) => (
              <div 
                key={itemKey}
                className={`
                  flex items-center space-x-3 p-3 rounded-md cursor-pointer border
                  ${itemKey in formData.extraItems ? 'bg-slate-100 border-primary' : 'bg-white border-slate-200'}
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
                  <Label htmlFor={`item-${itemKey}`} className="font-medium cursor-pointer">
                    {getItemName(itemKey)}
                  </Label>
                  <div className="text-sm text-slate-500">
                    {getItemPrice(itemKey)} PLN
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {Object.keys(formData.extraItems).length > 0 && (
            <div className="mt-4 pt-4 border-t">
              <div className="text-sm font-medium">Выбранные предметы:</div>
              <div className="mt-2 space-y-1">
                {Object.entries(formData.extraItems).map(([itemKey, quantity]) => (
                  <div key={itemKey} className="flex justify-between items-center text-sm py-2">
                    <span>{getItemName(itemKey as ItemKey)}</span>
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
                        {getItemPrice(itemKey as ItemKey) * quantity} PLN
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-between items-center mt-3 pt-3 border-t">
                <span>Дополнительно:</span>
                <span className="text-primary font-bold">
                  +{Object.entries(formData.extraItems).reduce((sum, [key, quantity]) => 
                    sum + getItemPrice(key as ItemKey) * quantity, 0)} PLN
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Статус и оплата</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Статус бронирования</Label>
              <Select
                value={formData.status}
                onValueChange={(value: any) => handleChange('status', value as BookingStatus)}
              >
                <SelectTrigger id="status">
                  <SelectValue placeholder="Выберите статус" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={BookingStatus.PENDING}>Ожидание</SelectItem>
                  <SelectItem value={BookingStatus.CONFIRMED}>Подтверждено</SelectItem>
                  <SelectItem value={BookingStatus.CANCELLED}>Отменено</SelectItem>
                  <SelectItem value={BookingStatus.COMPLETED}>Завершено</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="paymentStatus">Статус оплаты</Label>
              <Select
                value={formData.paymentStatus}
                onValueChange={(value: any) => handleChange('paymentStatus', value as PaymentStatus)}
              >
                <SelectTrigger id="paymentStatus">
                  <SelectValue placeholder="Выберите статус оплаты" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={PaymentStatus.PENDING}>Ожидание оплаты</SelectItem>
                  <SelectItem value={PaymentStatus.PAID}>Оплачено</SelectItem>
                  <SelectItem value={PaymentStatus.PARTIALLY_PAID}>Частично оплачено</SelectItem>
                  <SelectItem value={PaymentStatus.FAILED}>Ошибка оплаты</SelectItem>
                  <SelectItem value={PaymentStatus.REFUNDED}>Возврат</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="totalPrice">Общая сумма (PLN)</Label>
              <Input
                id="totalPrice"
                type="number"
                value={formData.totalPrice}
                onChange={(e) => handleChange('totalPrice', parseFloat(e.target.value))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="paidAmount">Оплаченная сумма (PLN)</Label>
              <Input
                id="paidAmount"
                type="number"
                value={formData.paidAmount}
                onChange={(e) => handleChange('paidAmount', parseFloat(e.target.value))}
              />
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div className="flex justify-end gap-2 mt-6">
        <Button className="border border-[#3a3637] bg-transparent text-[#e0e0e0] hover:bg-[#3a3637]/50 hover:text-white" onClick={() => router.push('/admin/bookings')}>
          Отмена
        </Button>
        <Button onClick={saveBooking} disabled={isSaving}>
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Сохранение...
            </>
          ) : (
            <>
              <Check className="mr-2 h-4 w-4" />
              Сохранить изменения
            </>
          )}
        </Button>
      </div>
    </div>
  );
} 