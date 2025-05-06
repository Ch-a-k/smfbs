import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { Booking, BookingFormData, TimeSlot, Room, mapDatabaseBookingToBooking, PaymentStatus } from '@/types/booking';
// Импортируем общие данные
import { bookings, packages, rooms, promoCodes } from './data';
// Временно отключаем для тестирования
// import { initializeP24Transaction } from '@/lib/przelewy24';
// import { sendBookingConfirmationEmail } from '@/lib/email';

// Импортируем клиент Supabase
import { createClient } from '@/utils/supabase/server';
import { format, parseISO, differenceInMinutes, startOfDay, addMinutes, isAfter, isBefore } from 'date-fns';
import crypto from 'crypto';

// Создаем клиент Supabase для серверных операций
const supabase = createClient();

// Данные пакетов уже должны быть внесены в Supabase
// Временно сохраняем функции для совместимости
// В дальнейшем их нужно будет переработать для использования Supabase

// Получить информацию о пакете по ID
async function getPackageById(packageId: string) {
  const { data, error } = await supabase
    .from('packages')
    .select('*')
    .eq('id', packageId)
    .single();
    
  if (error) {
    console.error('Error fetching package:', error);
    return null;
  }
  
  return data;
}

// Проверить доступность комнаты на указанную дату и время
async function isRoomAvailable(roomId: number, date: string, startTime: string, endTime: string): Promise<boolean> {
  const { data: roomData, error: roomError } = await supabase
    .from('rooms')
    .select('*')
    .eq('id', roomId)
    .single();
    
  if (roomError || !roomData) {
    console.error('Error fetching room data:', roomError);
    return false;
  }
  
  // Преобразуем данные из БД в формат Room
  const room: Room = {
    id: roomData.id,
    name: roomData.name,
    capacity: roomData.capacity || 0,
    maxPeople: roomData.max_people || 0,
    isActive: roomData.is_active,
    available: roomData.available !== undefined ? roomData.available : true,
    workSchedule: roomData.work_schedule || {}
  };
  
  // Проверяем активность комнаты
  if (!room.isActive || !room.available) {
    return false;
  }
  
  // Проверяем расписание работы комнаты
  if (room.workSchedule) {
    // Определяем день недели (0 - воскресенье, 1 - понедельник, и т.д.)
    const dayOfWeek = new Date(date).getDay();
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayName = dayNames[dayOfWeek];
    
    // Получаем расписание для этого дня
    const daySchedule = room.workSchedule[dayName as keyof typeof room.workSchedule];
    
    // Проверяем, работает ли комната в этот день
    if (!daySchedule || !daySchedule.isActive) {
      console.log(`Room ${roomId} is not active on ${dayName}`);
      return false;
    }
    
    // Проверяем, попадает ли время бронирования в рабочие часы комнаты
    if (startTime < daySchedule.startTime || endTime > daySchedule.endTime) {
      console.log(`Room ${roomId} is not available at this time (${startTime}-${endTime}). Work hours: ${daySchedule.startTime}-${daySchedule.endTime}`);
      return false;
    }
  }
  
  // Проверяем, нет ли уже бронирований для этой комнаты в это время
  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .eq('room_id', roomId)
    .eq('date', date)
    .or(`start_time.lte.${startTime},end_time.gt.${startTime}`)
    .or(`start_time.lt.${endTime},end_time.gte.${endTime}`)
    .or(`start_time.gte.${startTime},end_time.lte.${endTime}`);
    
  if (error) {
    console.error('Error checking room availability:', error);
    return false;
  }
  
  return data.length === 0;
}

// Получить доступные комнаты на указанную дату и время
async function getAvailableRooms(date: string, startTime: string, endTime: string, packageId: string): Promise<number[]> {
  const pkg = await getPackageById(packageId);
  if (!pkg) return [];
  
  // Сначала получаем все подходящие комнаты
  const { data: suitableRooms, error } = await supabase
    .from('rooms')
    .select('*')
    .gte('capacity', pkg.max_people)
    .eq('available', true);
    
  if (error || !suitableRooms) {
    console.error('Error fetching suitable rooms:', error);
    return [];
  }
  
  // Затем проверим доступность каждой подходящей комнаты
  const availableRoomIds: number[] = [];
  
  for (const room of suitableRooms) {
    if (await isRoomAvailable(room.id, date, startTime, endTime)) {
      availableRoomIds.push(room.id);
    }
  }
  
  // Если есть предпочтительные комнаты для пакета, отсортируем их на первые места
  if (pkg.preferred_rooms && pkg.preferred_rooms.length > 0) {
    availableRoomIds.sort((a, b) => {
      const aPreferred = pkg.preferred_rooms.includes(a);
      const bPreferred = pkg.preferred_rooms.includes(b);
      
      if (aPreferred && !bPreferred) return -1;
      if (!aPreferred && bPreferred) return 1;
      return 0;
    });
  }
  
  return availableRoomIds;
}

// Преобразование времени из строки в минуты от начала дня
function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

// Преобразование минут от начала дня в строку времени
function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

// Helper function to calculate duration in minutes
function calculateDuration(startTime: string | null, endTime: string | null): number {
  if (!startTime || !endTime) return 60; // Default duration
  
  try {
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);
    
    let durationMinutes = (endHour * 60 + endMinute) - (startHour * 60 + startMinute);
    if (durationMinutes <= 0) durationMinutes += 24 * 60; // Handle overnight
    
    return durationMinutes;
  } catch (e) {
    console.error('Error calculating duration:', e);
    return 60; // Default to 60 minutes if calculation fails
  }
}

// Helper function to calculate end time based on start time and duration
function calculateEndTime(startTime: string, durationMinutes: number): string {
  if (!startTime) return '00:00';
  
  try {
    const [hours, minutes] = startTime.split(':').map(Number);
    
    let totalMinutes = hours * 60 + minutes + durationMinutes;
    const endHours = Math.floor(totalMinutes / 60) % 24;
    const endMinutes = totalMinutes % 60;
    
    return `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
  } catch (e) {
    console.error('Error calculating end time:', e);
    return '00:00';
  }
}

// Применение промокода
async function applyPromoCode(price: number, promoCode?: string): Promise<{ price: number, discount?: number }> {
  if (!promoCode) return { price };
  
  const promoCodeUpperCase = promoCode.toUpperCase();
  
  const { data, error } = await supabase
    .from('promo_codes')
    .select('*')
    .eq('code', promoCodeUpperCase)
    .single();
    
  if (error || !data) {
    return { price };
  }
  
  const discount = data.discount_percent;
  const discountedPrice = price * (1 - discount / 100);
  
  return { 
    price: Math.round(discountedPrice), 
    discount 
  };
}

const formatDate = (date: Date | string): string => {
  const d = new Date(date);
  return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
};

// GET /api/bookings 
export async function GET(request: Request) {
  console.log('API: GET /api/bookings начал обработку запроса');
  
  try {
    const supabase = createClient();
    
    // Проверяем, успешно ли создан клиент Supabase
    if (!supabase) {
      console.error('API: Клиент Supabase не был создан');
      return NextResponse.json(
        { error: 'Ошибка подключения к базе данных' },
        { status: 500 }
      );
    }
    
    // Получаем URL и параметры запроса
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    
    console.log(`API: Запрос бронирований${id ? ` с ID: ${id}` : ''}`);
    
    let query = supabase.from('bookings').select('*');
    
    // Если указан ID, получаем конкретное бронирование
    if (id) {
      query = query.eq('id', id);
    }
    
    // Выполняем запрос к базе данных
    const { data: bookings, error } = await query;
    
    if (error) {
      console.error('API: Ошибка запроса бронирований:', error);
      return NextResponse.json(
        { error: 'Не удалось получить бронирования', details: error.message },
        { status: 500 }
      );
    }
    
    if (!bookings || bookings.length === 0) {
      console.log('API: Бронирования не найдены');
      return NextResponse.json([], { status: 200 });
    }
    
    console.log(`API: Найдено ${bookings.length} бронирований`);
    
    // Вспомогательная функция для форматирования даты
    const formatDate = (date: string | Date | null): string => {
      if (!date) return '';
      try {
        if (typeof date === 'string') {
          // Если дата уже в формате ISO строки (YYYY-MM-DD)
          if (date.match(/^\d{4}-\d{2}-\d{2}$/)) {
            return date;
          }
          // Разбираем строку в объект Date и форматируем
          return new Date(date).toISOString().split('T')[0];
        } else {
          // Если date уже объект Date
          return date.toISOString().split('T')[0];
        }
      } catch (e) {
        console.error(`API: Ошибка форматирования даты: ${date}`, e);
        return '';
      }
    };
    
    // Вспомогательная функция для расчета длительности
    const calculateDuration = (startTime: string, endTime: string): number => {
      if (!startTime || !endTime) return 60; // Значение по умолчанию
      
      const [startHour, startMinute] = startTime.split(':').map(Number);
      const [endHour, endMinute] = endTime.split(':').map(Number);
      
      let durationMinutes = (endHour * 60 + endMinute) - (startHour * 60 + startMinute);
      if (durationMinutes < 0) durationMinutes += 24 * 60; // Если переход через полночь
      
      return durationMinutes;
    };
    
    // Трансформируем данные для клиента
    const transformedBookings = bookings.map(booking => {
      // Для диагностики форматов дат
      console.log(`API: Трансформация бронирования ${booking.id}:`, {
        original_booking_date: booking.booking_date,
        original_created_at: booking.created_at
      });
      
      // Определяем дату бронирования
      let bookingDate = null;
      if (booking.booking_date) {
        bookingDate = formatDate(booking.booking_date);
        console.log(`API: Форматирование booking_date: ${booking.booking_date} -> ${bookingDate}`);
      } else if (booking.created_at) {
        bookingDate = formatDate(booking.created_at);
        console.log(`API: Используем created_at вместо booking_date: ${booking.created_at} -> ${bookingDate}`);
      } else {
        console.log(`API: Ни booking_date, ни created_at не найдены для бронирования ${booking.id}`);
        bookingDate = formatDate(new Date());
      }
      
      // Используем имена полей в соответствии с интерфейсом Booking
      return {
        id: booking.id,
        customerName: booking.customer_name || 'Без имени',
        customerPhone: booking.customer_phone || 'Без телефона',
        customerEmail: booking.customer_email || '',
        // Для совместимости с различными частями приложения
        name: booking.customer_name || 'Без имени', // Альтернативное поле для customerName
        phone: booking.customer_phone || 'Без телефона', // Альтернативное поле для customerPhone
        email: booking.customer_email || '', // Альтернативное поле для customerEmail
        
        // Используем правильные поля даты и времени
        date: bookingDate, // Основное поле даты
        bookingDate: bookingDate, // Альтернативное поле для date
        startTime: booking.start_time || '00:00',
        endTime: booking.end_time || '00:00',
        
        // Данные о комнате и пакете
        roomId: booking.room_id || 0,
        roomName: booking.room_name || `Room ${booking.room_id || 0}`,
        packageId: booking.package_id || 0,
        packageName: booking.package_name || `Package ${booking.package_id || 0}`,
        
        // Информация о количестве людей
        numPeople: booking.num_people || 1,
        numberOfPeople: booking.num_people || 1, // Альтернативное поле для numPeople
        
        // Дополнительная информация
        notes: booking.notes || '',
        comment: booking.notes || '', // Альтернативное поле для notes
        adminComment: booking.admin_comment || '',
        promoCode: booking.promo_code || '',
        
        // Информация о платеже
        totalPrice: booking.total_price || 0,
        totalAmount: booking.total_price || 0, // Альтернативное поле для totalPrice
        paymentStatus: (booking.payment_status?.toUpperCase() || 'UNPAID') as PaymentStatus,
        paidAmount: booking.paid_amount || 0,
        
        // Статус и даты создания/обновления
        status: booking.status || 'created',
        createdAt: booking.created_at || new Date().toISOString(),
        updatedAt: booking.updated_at || new Date().toISOString()
      };
    });
    
    console.log(`API: Успешно трансформировано ${transformedBookings.length} бронирований`);
    console.log('API: Пример трансформированного бронирования:', 
      transformedBookings.length > 0 ? JSON.stringify(transformedBookings[0]) : 'нет бронирований');
    
    // ВАЖНО: Возвращаем массив напрямую, без обертки в объект!
    // Компонент страницы ожидает массив, а не объект с полем bookings
    return NextResponse.json(transformedBookings, { status: 200 });
  } catch (e) {
    console.error('API: Необработанная ошибка в GET /api/bookings:', e);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера', details: e instanceof Error ? e.message : String(e) },
      { status: 500 }
    );
  }
}

// POST /api/bookings
export async function POST(request: Request) {
  console.log('API: POST /api/bookings начал обработку запроса');
  
  try {
    const supabase = createClient();
    
    // Проверяем, успешно ли создан клиент Supabase
    if (!supabase) {
      console.error('API: Клиент Supabase не был создан');
      return NextResponse.json(
        { error: 'Ошибка подключения к базе данных' },
        { status: 500 }
      );
    }
    
    const data = await request.json();
    console.log('API: Полученные данные для создания бронирования:', data);
    
    // Отображаем формат даты для диагностики
    if (data.date) {
      console.log(`API: Дата бронирования из запроса: ${data.date} (тип: ${typeof data.date})`);
    }
    
    // Вспомогательная функция для расчета времени окончания
    const calculateEndTime = (startTime: string, durationMinutes: number): string => {
      if (!startTime) return '00:00';
      
      const [hours, minutes] = startTime.split(':').map(Number);
      const totalMinutes = hours * 60 + minutes + durationMinutes;
      
      const endHours = Math.floor(totalMinutes / 60) % 24;
      const endMinutes = totalMinutes % 60;
      
      return `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
    };
    
    // Получаем имя клиента из разных возможных полей
    const customerName = data.customerName || data.name || data.clientName || '';
    
    // Создаем структуру данных совместимую с БД
    const bookingData = {
      customer_name: customerName,
      customer_phone: data.customerPhone || data.phone || data.clientPhone || '',
      customer_email: data.customerEmail || data.email || data.clientEmail || '',
      booking_date: data.date, // Используем date из запроса
      start_time: data.startTime || data.time || '00:00',
      end_time: data.endTime || calculateEndTime(data.startTime || data.time || '00:00', data.duration || 60),
      num_people: data.numPeople || data.numberOfPeople || 1,
      room_id: data.roomId,
      package_id: data.packageId,
      status: data.status || 'confirmed',
      payment_status: (data.paymentStatus || 'unpaid').toLowerCase(),
      notes: data.notes || data.comment || '',
      admin_comment: data.adminComment || '',
      total_price: data.totalPrice || data.totalAmount || data.price || 0,
      paid_amount: data.paidAmount || 0,
      promo_code: data.promoCode || '',
    };
    
    console.log('API: Подготовленные данные для БД:', bookingData);
    
    const { data: booking, error } = await supabase
      .from('bookings')
      .insert([bookingData])
      .select()
      .single();
      
    if (error) {
      console.error('API: Ошибка создания бронирования:', error);
      return NextResponse.json(
        { error: 'Не удалось создать бронирование', details: error.message },
        { status: 500 }
      );
    }
    
    console.log('API: Бронирование успешно создано:', booking);
    
    // Вспомогательная функция для форматирования даты
    const formatDate = (date: string | Date | null): string => {
      if (!date) return '';
      try {
        if (typeof date === 'string') {
          // Если дата уже в формате ISO строки (YYYY-MM-DD)
          if (date.match(/^\d{4}-\d{2}-\d{2}$/)) {
            return date;
          }
          // Разбираем строку в объект Date и форматируем
          return new Date(date).toISOString().split('T')[0];
        } else {
          // Если date уже объект Date
          return date.toISOString().split('T')[0];
        }
      } catch (e) {
        console.error(`API: Ошибка форматирования даты: ${date}`, e);
        return '';
      }
    };
    
    // Определяем дату бронирования
    let bookingDate = '';
    if (booking.booking_date) {
      bookingDate = formatDate(booking.booking_date);
    } else if (booking.created_at) {
      bookingDate = formatDate(booking.created_at);
    } else {
      bookingDate = formatDate(new Date());
    }
    
    // Вспомогательная функция для расчета длительности
    const calculateDuration = (startTime: string, endTime: string): number => {
      if (!startTime || !endTime) return 60; // Значение по умолчанию
      
      const [startHour, startMinute] = startTime.split(':').map(Number);
      const [endHour, endMinute] = endTime.split(':').map(Number);
      
      let durationMinutes = (endHour * 60 + endMinute) - (startHour * 60 + startMinute);
      if (durationMinutes < 0) durationMinutes += 24 * 60; // Если переход через полночь
      
      return durationMinutes;
    };
    
    // Преобразуем данные в формат, совместимый с интерфейсом Booking
    const transformedBooking = {
      id: booking.id,
      customerName: booking.customer_name || 'Без имени',
      customerPhone: booking.customer_phone || 'Без телефона',
      customerEmail: booking.customer_email || '',
      // Для совместимости с различными частями приложения
      name: booking.customer_name || 'Без имени', // Альтернативное поле для customerName
      phone: booking.customer_phone || 'Без телефона', // Альтернативное поле для customerPhone
      email: booking.customer_email || '', // Альтернативное поле для customerEmail
      
      // Используем правильные поля даты и времени
      date: bookingDate, // Основное поле даты
      bookingDate: bookingDate, // Альтернативное поле для date
      startTime: booking.start_time || '00:00',
      endTime: booking.end_time || '00:00',
      
      // Данные о комнате и пакете
      roomId: booking.room_id || 0,
      roomName: booking.room_name || `Room ${booking.room_id || 0}`,
      packageId: booking.package_id || 0,
      packageName: booking.package_name || `Package ${booking.package_id || 0}`,
      
      // Информация о количестве людей
      numPeople: booking.num_people || 1,
      numberOfPeople: booking.num_people || 1, // Альтернативное поле для numPeople
      
      // Дополнительная информация
      notes: booking.notes || '',
      comment: booking.notes || '', // Альтернативное поле для notes
      adminComment: booking.admin_comment || '',
      promoCode: booking.promo_code || '',
      
      // Информация о платеже
      totalPrice: booking.total_price || 0,
      totalAmount: booking.total_price || 0, // Альтернативное поле для totalPrice
      paymentStatus: (booking.payment_status?.toUpperCase() || 'UNPAID') as PaymentStatus,
      paidAmount: booking.paid_amount || 0,
      
      // Статус и даты создания/обновления
      status: booking.status || 'created',
      createdAt: booking.created_at || new Date().toISOString(),
      updatedAt: booking.updated_at || new Date().toISOString()
    };
    
    console.log('API: Трансформированное бронирование:', transformedBooking);
    
    return NextResponse.json(transformedBooking, { status: 201 });
  } catch (error) {
    console.error('API: Необработанная ошибка в POST /api/bookings:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  // Обновление существующего бронирования
  try {
    const data = await request.json();
    
    if (!data.id) {
      return NextResponse.json({ 
        error: 'Missing booking ID',
        message: 'Brak ID rezerwacji'
      }, { status: 400 });
    }
    
    // Проверяем, существует ли бронирование с указанным ID
    const { data: existingBooking, error: fetchError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', data.id)
      .single();
      
    if (fetchError || !existingBooking) {
      return NextResponse.json({ 
        error: 'Booking not found',
        message: 'Nie znaleziono rezerwacji'
      }, { status: 404 });
    }
    
    // Подготавливаем данные для обновления
    const updateData: Record<string, any> = {};
    
    // Обрабатываем только те поля, которые были переданы
    if (data.payment_status) updateData['payment_status'] = data.payment_status;
    if (data.admin_comment) updateData['admin_comment'] = data.admin_comment;
    if (data.paid_amount !== undefined) updateData['paid_amount'] = data.paid_amount;
    
    // Обновление бронирования
    const { data: updatedBooking, error: updateError } = await supabase
      .from('bookings')
      .update({
        ...updateData,
        updated_at: new Date()
      })
      .eq('id', data.id)
      .select()
      .single();
      
    if (updateError) {
      console.error('Error updating booking:', updateError);
      return NextResponse.json({ 
        error: 'Failed to update booking',
        message: 'Nie udało się zaktualizować rezerwacji'
      }, { status: 500 });
    }
    
    return NextResponse.json({
      booking: updatedBooking,
      message: 'Booking updated successfully'
    });
  } catch (error) {
    console.error('Error in PUT /api/bookings:', error);
    return NextResponse.json({ 
      error: 'Internal Server Error',
      message: 'Wystąpił błąd serwera'
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Получаем ID из URL или из тела запроса
    const { searchParams } = new URL(request.url);
    let id = searchParams.get('id');
    
    // Если ID нет в URL, пробуем получить из тела запроса
    if (!id) {
      try {
        const body = await request.json();
        id = body.id;
      } catch (e) {
        // Если тело запроса не является JSON или не содержит id, продолжаем с пустым id
      }
    }
    
    if (!id) {
      return NextResponse.json({ error: 'Booking ID is required' }, { status: 400 });
    }
    
    // Опционально: вместо удаления можно обновить статус на 'cancelled'
    const { data, error } = await supabase
      .from('bookings')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
      
    if (error) {
      console.error(`Error cancelling booking with id ${id}:`, error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }
    
    return NextResponse.json({
      message: 'Booking cancelled successfully',
      id: data.id
    });
  } catch (error) {
    console.error('Unexpected error in DELETE /api/bookings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Функции для проверки и валидации
const validateBookingData = (booking: Booking) => {
  // Здесь должен быть код для валидации данных бронирования
  return true;
};

// Проверка доступности комнаты с учетом расписания
const checkRoomScheduleCompatibility = (room: Room, date: string, startTime: string, endTime: string) => {
  // Здесь должен быть код для проверки расписания
  return true;
};

// Получение полного расписания с продолжительностью
const getFullScheduleWithDuration = (room: Room) => {
  // Здесь должен быть код для получения расписания
  return {};
}; 