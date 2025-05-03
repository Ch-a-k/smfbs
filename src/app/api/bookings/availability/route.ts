import { NextResponse } from 'next/server';
import { addMinutes, areIntervalsOverlapping, parseISO } from 'date-fns';
import { DaySchedule, Room, RoomSchedule, mapDatabaseRoomToRoom } from '@/types/booking';
import { normalizeRoomSchedule } from '@/utils/supabase/functions';

// Импортируем серверный клиент Supabase
import { createClient } from '@/utils/supabase/server';

// Создаем клиент Supabase для серверных запросов
const supabase = createClient();

// Получение пакета по ID
async function getPackageById(packageId: string) {
  console.log(`Getting package with ID: ${packageId}`);
  
  const { data, error } = await supabase
    .from('packages')
    .select('*')
    .eq('id', packageId)
    .single();
    
  if (error) {
    console.error('Error fetching package:', error);
    return null;
  }
  
  console.log('Package found:', data);
  
  // Преобразуем данные пакета в нужный формат
  return {
    id: data.id,
    name: data.name || '',
    description: data.description || '',
    price: data.price || 0,
    depositAmount: data.deposit_amount || 0,
    duration: data.duration || 60, // Используем значение по умолчанию, если duration не задано
    maxPeople: data.max_people || 1,
    preferredRooms: data.preferred_rooms || []
  };
}

// Получение всех комнат
async function getAllRooms(): Promise<Room[]> {
  const { data, error } = await supabase
    .from('rooms')
    .select('*');
    
  if (error) {
    console.error('Error fetching rooms:', error);
    return [];
  }
  
  // Преобразуем данные из БД в формат Room, используя функции маппинга
  return data.map((room: any) => {
    const mappedRoom = mapDatabaseRoomToRoom(room);
    
    // Нормализуем расписание, чтобы убедиться в наличии всех дней и правильных полей
    mappedRoom.workSchedule = normalizeRoomSchedule(room.work_schedule);
    
    return mappedRoom;
  });
}

// Проверить доступность комнаты на указанную дату и время с учетом расписания работы
async function isRoomAvailable(room: Room, date: string, startTime: string, endTime: string): Promise<boolean> {
  // Проверяем активность комнаты
  if (!room.isActive || !room.available) {
    console.log(`Room ${room.id} is not active or available`);
    return false;
  }
  
  // Проверяем расписание работы комнаты
  if (room.workSchedule) {
    // Определяем день недели (0 - воскресенье, 1 - понедельник, и т.д.)
    const dayOfWeek = new Date(date).getDay();
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayName = dayNames[dayOfWeek];
    
    // Получаем расписание для этого дня
    const daySchedule = room.workSchedule[dayName as keyof RoomSchedule];
    
    if (!daySchedule) {
      console.log(`Room ${room.id} has no schedule for ${dayName}`);
      return false;
    }
    
    // Проверяем, работает ли комната в этот день
    if (!daySchedule.isActive) {
      console.log(`Room ${room.id} is not active on ${dayName}`);
      return false;
    }
    
    // Проверяем, попадает ли время бронирования в рабочие часы комнаты
    if (startTime < daySchedule.startTime || endTime > daySchedule.endTime) {
      console.log(`Room ${room.id} is not available at this time (${startTime}-${endTime}). Work hours: ${daySchedule.startTime}-${daySchedule.endTime}`);
      return false;
    }
  }
  
  // Проверяем, нет ли уже бронирований для этой комнаты в это время
  try {
    // Используем единый формат запроса с проверкой обоих возможных полей даты
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('room_id', room.id)
      .or(`date.eq.${date},booking_date.eq.${date}`)
      .neq('status', 'cancelled');
      
    if (error) {
      console.error(`Error checking bookings for room ${room.id}:`, error);
      // При ошибке запроса лучше считать комнату недоступной
      return false;
    }
    
    console.log(`Found ${data?.length || 0} bookings for room ${room.id} on date ${date}`);
    
    // Если нет бронирований, комната доступна
    if (!data || data.length === 0) {
      return true;
    }
    
    // Проверяем, нет ли пересечений с существующими бронированиями
    for (const booking of data) {
      // Получаем start_time и end_time
      const bookingStart = booking.start_time || '';
      const bookingEnd = booking.end_time || '';
      
      // Убеждаемся, что времена в формате HH:MM
      const normalizedBookingStart = bookingStart.includes('T') 
        ? bookingStart.split('T')[1].substr(0, 5) 
        : bookingStart;
        
      const normalizedBookingEnd = bookingEnd.includes('T') 
        ? bookingEnd.split('T')[1].substr(0, 5) 
        : bookingEnd;
      
      console.log(`Existing booking: ${normalizedBookingStart}-${normalizedBookingEnd}, checking against ${startTime}-${endTime}`);
      
      // Проверяем пересечение временных интервалов
      if (
        (startTime <= normalizedBookingStart && endTime > normalizedBookingStart) ||  // Новое бронирование начинается до существующего и заканчивается после его начала
        (startTime < normalizedBookingEnd && endTime >= normalizedBookingEnd) ||     // Новое бронирование начинается до конца существующего и заканчивается после него
        (startTime >= normalizedBookingStart && endTime <= normalizedBookingEnd)     // Новое бронирование полностью внутри существующего
      ) {
        console.log(`Room ${room.id} is already booked at ${normalizedBookingStart}-${normalizedBookingEnd}`);
        return false;
      }
    }
    
    return true;
  } catch (e) {
    console.error(`Exception checking bookings for room ${room.id}:`, e);
    return false;
  }
}

// Получить доступные комнаты на указанную дату и время
async function getAvailableRooms(date: string, startTime: string, endTime: string, minCapacity: number): Promise<Room[]> {
  console.log(`Checking available rooms for date=${date}, time=${startTime}-${endTime}, minCapacity=${minCapacity}`);
  const rooms = await getAllRooms();
  const availableRooms: Room[] = [];
  
  for (const room of rooms) {
    // Проверяем вместимость комнаты: используем maxPeople если доступно, иначе capacity
    const roomCapacity = room.maxPeople || room.capacity;
    
    if (roomCapacity < minCapacity) {
      console.log(`Room ${room.id} (${room.name}) skipped: capacity ${roomCapacity} < required ${minCapacity}`);
      continue;
    }
    
    // Проверяем доступность комнаты
    const isAvailable = await isRoomAvailable(room, date, startTime, endTime);
    if (isAvailable) {
      availableRooms.push(room);
      console.log(`Room ${room.id} (${room.name}) is available`);
    } else {
      console.log(`Room ${room.id} (${room.name}) is NOT available`);
    }
  }
  
  console.log(`Found ${availableRooms.length} available rooms`);
  return availableRooms;
}

// Преобразование строки времени в минуты от начала дня
function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

// Преобразование минут в строку времени
function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

// Расчет времени окончания бронирования
function calculateEndTime(startTime: string, durationMinutes: number): string {
  const startMinutes = timeToMinutes(startTime);
  const endMinutes = startMinutes + durationMinutes;
  return minutesToTime(endMinutes);
}

// Функция для проверки структуры базы данных
async function checkDatabase() {
  try {
    console.log('Checking Supabase database structure...');
    
    // Проверяем таблицу rooms (самое важное)
    const { data: rooms, error: roomsError } = await supabase
      .from('rooms')
      .select('count()')
      .limit(1);
      
    if (roomsError) {
      console.error('Error accessing rooms table:', roomsError);
    } else {
      console.log('Rooms table OK');
    }
    
    // Проверяем таблицу packages (если есть ошибка, не останавливаем выполнение)
    const { error: packagesError } = await supabase
      .from('packages')
      .select('count(*)')
      .limit(1);
      
    if (packagesError) {
      console.warn('Warning: Issue with packages table:', packagesError.message);
    } else {
      console.log('Packages table OK');
    }
    
    // Не проверяем детально другие таблицы, чтобы не блокировать API
  } catch (e) {
    console.error('Non-critical error checking database:', e);
    // Продолжаем выполнение даже при ошибке
  }
}

// GET эндпоинт для получения доступных комнат и временных слотов
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  
  // Получаем параметры запроса
  const date = searchParams.get('date');             // Дата в формате YYYY-MM-DD
  const packageId = searchParams.get('packageId');   // ID пакета
  const startTime = searchParams.get('startTime');   // Начальное время (необязательно)
  const people = searchParams.get('people');         // Количество людей
  const type = searchParams.get('type') || 'all';    // Тип данных для возврата: rooms, slots, all
  
  console.log('API Request:', { date, packageId, startTime, people, type });
  
  // Проверяем структуру базы данных при первом запросе
  try {
    await checkDatabase();
  } catch (e) {
    console.error('Database check failed but continuing:', e);
  }
  
  // Проверяем наличие обязательных параметров
  if (!date) {
    return NextResponse.json({ error: 'Date is required' }, { status: 400 });
  }
  
  const currentDate = new Date();
  const selectedDate = new Date(date);
  
  // Проверяем, что выбранная дата не в прошлом
  if (selectedDate < new Date(currentDate.setHours(0, 0, 0, 0))) {
    return NextResponse.json({ error: 'Cannot book dates in the past' }, { status: 400 });
  }
  
  try {
    // Если нужны временные слоты
    if (type === 'slots' || type === 'all') {
      // Если не указан пакет, вернуть ошибку
      if (!packageId) {
        return NextResponse.json({ error: 'Package ID is required for time slots' }, { status: 400 });
      }
      
      // Получаем информацию о пакете
      const pkg = await getPackageById(packageId);
      if (!pkg) {
        return NextResponse.json({ error: 'Package not found' }, { status: 404 });
      }
      
      console.log(`Found package with duration: ${pkg.duration} minutes`);
      
      // Получаем все комнаты
      const allRooms = await getAllRooms();
      if (allRooms.length === 0) {
        console.log('No rooms found in the database');
        return NextResponse.json({ error: 'No rooms available' }, { status: 404 });
      }
      
      console.log(`Found ${allRooms.length} rooms, generating time slots with package duration: ${pkg.duration} minutes`);
      
      // Минимальное количество людей (fallback на 1, если не указано)
      let minPeople = 1;
      if (people) {
        minPeople = parseInt(people);
        if (isNaN(minPeople) || minPeople < 1) {
          minPeople = 1;
        }
      }
      console.log(`Using minimum people count: ${minPeople}`);
      
      // Генерируем потенциальные временные слоты
      const timeSlots = [];
      const startHour = 8;  // Начало рабочего дня в 8:00
      const endHour = 22;   // Конец рабочего дня в 22:00
      const step = 30;      // Шаг в 30 минут
      
      try {
        for (let hour = startHour; hour < endHour; hour++) {
          for (let minute = 0; minute < 60; minute += step) {
            const slotStartTime = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
            const slotEndTime = calculateEndTime(slotStartTime, pkg.duration);
            
            // Пропускаем слоты, которые выходят за пределы рабочего дня
            if (timeToMinutes(slotEndTime) > timeToMinutes(`${endHour}:00`)) {
              continue;
            }
            
            // Проверяем, есть ли доступные комнаты для этого слота
            const availableRooms = await getAvailableRooms(date, slotStartTime, slotEndTime, minPeople);
            
            timeSlots.push({
              id: `${date}-${slotStartTime}`,
              startTime: slotStartTime,
              endTime: slotEndTime,
              available: availableRooms.length > 0,
              availableRooms: availableRooms.map(room => room.id)
            });
          }
        }
        
        console.log(`Generated ${timeSlots.length} time slots, available: ${timeSlots.filter(slot => slot.available).length}`);
        
        // Возвращаем только временные слоты, если тип 'slots'
        if (type === 'slots') {
          return NextResponse.json(timeSlots);
        }
        
        // Если нужно вернуть всё, добавляем временные слоты в ответ
        return NextResponse.json({
          timeSlots,
          availableRooms: []  // Это будет заполнено ниже, если нужно
        });
      } catch (slotError) {
        console.error('Error generating time slots:', slotError);
        return NextResponse.json({ error: 'Error generating time slots' }, { status: 500 });
      }
    }
    
    // Если нужны доступные комнаты
    if (type === 'rooms' || type === 'all') {
      // Проверяем наличие параметров
      if (!startTime) {
        return NextResponse.json({ error: 'Start time is required for room availability' }, { status: 400 });
      }
      
      // Если указан ID пакета, получаем его продолжительность
      let duration = 60; // По умолчанию 60 минут
      if (packageId) {
        const pkg = await getPackageById(packageId);
        if (pkg) {
          duration = pkg.duration;
        }
      }
      
      // Вычисляем время окончания
      const endTime = calculateEndTime(startTime, duration);
      
      // Минимальная вместимость комнаты
      const minCapacity = people ? parseInt(people) : 1;
      
      // Получаем доступные комнаты
      const availableRooms = await getAvailableRooms(date, startTime, endTime, minCapacity);
      
      // Возвращаем только список комнат, если тип 'rooms'
      if (type === 'rooms') {
        return NextResponse.json(availableRooms);
      }
      
      // Если тип 'all', то обновляем объект ответа, добавляя комнаты
      return NextResponse.json({
        timeSlots: [],  // Это будет заполнено выше, если нужно
        availableRooms
      });
    }
    
    // Если указан неизвестный тип
    return NextResponse.json({ error: 'Invalid type. Use "rooms", "slots", or "all"' }, { status: 400 });
    
  } catch (error) {
    console.error('Error processing availability request:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 