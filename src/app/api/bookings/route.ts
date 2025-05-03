import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { Booking, BookingFormData, TimeSlot, Room } from '@/types/booking';
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

// Расчет времени окончания бронирования по времени начала и продолжительности
function calculateEndTime(startTime: string, durationMinutes: number): string {
  const startMinutes = timeToMinutes(startTime);
  const endMinutes = startMinutes + durationMinutes;
  return minutesToTime(endMinutes);
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

// Основные маршруты API
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const id = searchParams.get('id');
    const date = searchParams.get('date');

    // Получение всех бронирований
    if (!type && !id) {
      const { data, error } = await supabase
        .from('bookings')
        .select('*, rooms(name), packages(name)')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching bookings:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      // Преобразование данных из базы данных в формат, ожидаемый клиентом
      const bookings = data.map((booking) => ({
        id: booking.id,
        packageId: booking.package_id,
        packageName: booking.packages?.name || '',
        roomId: booking.room_id,
        roomName: booking.rooms?.name || '',
        customerName: booking.customer_name,
        customerEmail: booking.customer_email,
        customerPhone: booking.customer_phone,
        date: booking.booking_date || new Date(booking.created_at).toISOString().split('T')[0],
        startTime: booking.start_time,
        endTime: booking.end_time,
        numPeople: booking.num_people,
        notes: booking.notes,
        promoCode: booking.promo_code,
        totalPrice: booking.total_price,
        paymentStatus: booking.payment_status,
        paidAmount: booking.paid_amount,
        status: booking.status,
        createdAt: booking.created_at,
        updatedAt: booking.updated_at
      }));

      return NextResponse.json(bookings);
    }

    // Получение конкретного бронирования по ID
    if (id) {
      const { data, error } = await supabase
        .from('bookings')
        .select('*, rooms(name), packages(name)')
        .eq('id', id)
        .single();

      if (error) {
        console.error(`Error fetching booking with id ${id}:`, error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      if (!data) {
        return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
      }

      const booking = {
        id: data.id,
        packageId: data.package_id,
        packageName: data.packages?.name || '',
        roomId: data.room_id,
        roomName: data.rooms?.name || '',
        customerName: data.customer_name,
        customerEmail: data.customer_email,
        customerPhone: data.customer_phone,
        date: data.booking_date || new Date(data.created_at).toISOString().split('T')[0],
        startTime: data.start_time,
        endTime: data.end_time,
        numPeople: data.num_people,
        notes: data.notes,
        promoCode: data.promo_code,
        totalPrice: data.total_price,
        paymentStatus: data.payment_status,
        paidAmount: data.paid_amount,
        status: data.status,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };

      return NextResponse.json(booking);
    }

    // Получение слотов на определенную дату
    if (type === 'slots' && date) {
      // Получение существующих бронирований на эту дату
      const { data: existingBookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('room_id, start_time, end_time')
        .eq('booking_date', date)
        .neq('status', 'cancelled');

      if (bookingsError) {
        console.error(`Error fetching existing bookings for date ${date}:`, bookingsError);
        return NextResponse.json({ error: bookingsError.message }, { status: 500 });
      }

      // Преобразуем существующие бронирования в более удобный формат
      const bookingsByRoom: Record<number, Array<{ start: string, end: string }>> = {};
      
      existingBookings?.forEach(booking => {
        const roomId = booking.room_id;
        if (!bookingsByRoom[roomId]) {
          bookingsByRoom[roomId] = [];
        }
        
        bookingsByRoom[roomId].push({
          start: booking.start_time,
          end: booking.end_time
        });
      });

      // Получение всех комнат
      const { data: rooms, error: roomsError } = await supabase
        .from('rooms')
        .select('*');

      if (roomsError) {
        console.error('Error fetching rooms:', roomsError);
        return NextResponse.json({ error: roomsError.message }, { status: 500 });
      }

      // Генерация временных слотов
      const timeSlots = generateTimeSlots();
      const schedule = createRoomSchedule(rooms, timeSlots, bookingsByRoom);

      return NextResponse.json(schedule);
    }

    return NextResponse.json({ error: 'Invalid request parameters' }, { status: 400 });
  } catch (error) {
    console.error('Unexpected error in GET /api/bookings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Функция для генерации временных слотов
function generateTimeSlots() {
  // Здесь можно настроить рабочее время
  const startHour = 9; // 9 AM
  const endHour = 22; // 10 PM
  const intervalMinutes = 30;
  
  const slots = [];
  for (let hour = startHour; hour < endHour; hour++) {
    for (let minute = 0; minute < 60; minute += intervalMinutes) {
      const startTime = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:00`;
      
      // Вычисляем время окончания
      let endHour = hour;
      let endMinute = minute + intervalMinutes;
      
      if (endMinute >= 60) {
        endHour += 1;
        endMinute -= 60;
      }
      
      // Проверяем, не превысили ли мы endHour
      if (endHour >= endHour) {
        const endTime = `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}:00`;
        
        slots.push({
          id: `${startTime}-${endTime}`,
          startTime,
          endTime
        });
      }
    }
  }
  
  return slots;
}

// Функция для создания расписания комнат
function createRoomSchedule(
  rooms: any[], 
  timeSlots: any[], 
  bookingsByRoom: Record<number, Array<{ start: string, end: string }>>
) {
  const roomSchedule = rooms.map(room => {
    const daySchedule = {
      roomId: room.id,
      roomName: room.name,
      slots: timeSlots.map(slot => {
        const slotStartTime = slot.startTime;
        const slotEndTime = slot.endTime;
        
        // Проверяем, есть ли пересечения с существующими бронированиями
        let isAvailable = true;
        
        if (bookingsByRoom[room.id]) {
          for (const booking of bookingsByRoom[room.id]) {
            const bookingStartTime = booking.start;
            const bookingEndTime = booking.end;
            
            // Проверяем пересечение времени
            // Слот недоступен, если:
            // 1. Начало слота находится между началом и концом бронирования или
            // 2. Конец слота находится между началом и концом бронирования или
            // 3. Начало бронирования находится между началом и концом слота или
            // 4. Конец бронирования находится между началом и концом слота
            if (
              (slotStartTime >= bookingStartTime && slotStartTime < bookingEndTime) ||
              (slotEndTime > bookingStartTime && slotEndTime <= bookingEndTime) ||
              (bookingStartTime >= slotStartTime && bookingStartTime < slotEndTime) ||
              (bookingEndTime > slotStartTime && bookingEndTime <= slotEndTime)
            ) {
              isAvailable = false;
              break;
            }
          }
        }
        
        return {
          ...slot,
          isAvailable
        };
      })
    };
    
    return daySchedule;
  });
  
  return {
    date: new Date().toISOString().split('T')[0],
    rooms: roomSchedule
  };
}

export async function POST(request: NextRequest) {
  try {
    const booking = await request.json();
    
    // Валидация данных бронирования (можно расширить по необходимости)
    if (!booking.roomId || !booking.packageId || !booking.customerName) {
        return NextResponse.json(
        { error: 'Missing required fields: roomId, packageId, or customerName' },
          { status: 400 }
        );
      }
      
    // Подготовка данных для вставки в БД
      const bookingData = {
      room_id: booking.roomId,
      package_id: booking.packageId,
      booking_date: booking.date,
      start_time: booking.startTime,
      end_time: booking.endTime,
      customer_name: booking.customerName,
      customer_email: booking.customerEmail || null,
      customer_phone: booking.customerPhone || null,
      num_people: typeof booking.numPeople === 'string' 
        ? parseInt(booking.numPeople, 10) 
        : booking.numPeople || 1,
      notes: booking.notes || null,
      promo_code: booking.promoCode || null,
      total_price: booking.totalPrice || 0,
      payment_status: booking.paymentStatus || 'unpaid',
      paid_amount: booking.paidAmount || 0,
      status: booking.status || 'confirmed',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
    // Вставка данных в базу
      const { data, error } = await supabase
        .from('bookings')
      .insert(bookingData)
        .select()
        .single();
      
      if (error) {
      console.error('Error creating booking:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

      return NextResponse.json({
      id: data.id,
      packageId: data.package_id,
      roomId: data.room_id,
      customerName: data.customer_name,
      customerEmail: data.customer_email,
      customerPhone: data.customer_phone,
      date: data.booking_date,
      startTime: data.start_time,
      endTime: data.end_time,
      numPeople: data.num_people,
      notes: data.notes,
      promoCode: data.promo_code,
      totalPrice: data.total_price,
      paymentStatus: data.payment_status,
      paidAmount: data.paid_amount,
      status: data.status,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    });
  } catch (error) {
    console.error('Unexpected error in POST /api/bookings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
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