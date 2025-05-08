import { mockBookings, mockPackages, mockRooms, mockPromoCodes, mockCrossSellItems, generateNewId, getDefaultWorkSchedule as getDefaultSchedule } from './mock-data';
import { Booking, BookingFormData, Package, Room, TimeSlot, PaymentStatus } from '@/types/booking';
import { format, parseISO, differenceInMinutes, startOfDay, addMinutes, isAfter, isBefore } from 'date-fns';

// Экспортируем функцию getDefaultWorkSchedule для использования в других файлах
export const getDefaultWorkSchedule = getDefaultSchedule;

// Клонируем данные, чтобы работать с копией (для возможности модификации)
let bookings = [...mockBookings];
let packages = [...mockPackages];
let rooms = [...mockRooms];
let promoCodes = [...mockPromoCodes];
let crossSellItems = [...mockCrossSellItems];

// УТИЛИТЫ

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

// API ДЛЯ РАБОТЫ С БРОНИРОВАНИЯМИ

// Получить все бронирования
export async function getAllBookings(): Promise<Booking[]> {
  return [...bookings];
}

// Получить бронирование по ID
export async function getBookingById(id: number): Promise<Booking | null> {
  const booking = bookings.find(b => b.id === id);
  return booking || null;
}

// Получить бронирования на определенную дату
export async function getBookingsByDate(date: string): Promise<Booking[]> {
  return bookings.filter(b => b.date === date);
}

// Создать новое бронирование
export async function createBooking(data: BookingFormData): Promise<Booking> {
  // Найти информацию о выбранном пакете
  const selectedPackage = packages.find(p => p.id.toString() === data.packageId.toString());
  if (!selectedPackage) {
    throw new Error('Выбранный пакет не найден');
  }

  // Найти информацию о выбранной комнате
  const selectedRoom = rooms.find(r => r.id === data.roomId);
  if (!selectedRoom) {
    throw new Error('Выбранная комната не найдена');
  }

  // Рассчитываем конечное время на основе времени начала и продолжительности пакета
  const endTime = data.endTime || calculateEndTime(data.startTime, selectedPackage.duration);

  // Проверить доступность комнаты на указанное время
  const isAvailable = await isRoomAvailable(data.roomId, data.date, data.startTime, endTime);
  if (!isAvailable) {
    throw new Error('Комната недоступна на указанное время');
  }

  // Применить промокод, если есть
  let totalPrice = Number(selectedPackage.price);
  let discount = 0;

  if (data.promoCode) {
    const promoResult = await applyPromoCode(totalPrice, data.promoCode);
    totalPrice = promoResult.price;
    discount = promoResult.discount || 0;
  }

  // Создаем новое бронирование
  const newBooking: Booking = {
    id: generateNewId(),
    packageId: Number(data.packageId) || 0,
    packageName: selectedPackage.name,
    roomId: data.roomId,
    roomName: selectedRoom.name,
    customerName: data.name,
    customerEmail: data.email,
    customerPhone: data.phone,
    date: data.date,
    startTime: data.startTime,
    endTime: endTime,
    numPeople: data.numberOfPeople || 1,
    numberOfPeople: data.numberOfPeople || 1,
    notes: data.comment || '',
    comment: data.comment || '',
    promoCode: data.promoCode || '',
    totalPrice: totalPrice,
    totalAmount: totalPrice,
    paymentStatus: 'UNPAID',
    paidAmount: 0,
    depositAmount: selectedPackage.depositAmount,
    status: 'pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    name: data.name,
    email: data.email,
    phone: data.phone,
  };

  // Добавляем новое бронирование в общий список
  bookings.push(newBooking);
  
  return newBooking;
}

// Обновить существующее бронирование
export async function updateBooking(id: number, data: Partial<Booking>): Promise<Booking> {
  const bookingIndex = bookings.findIndex(b => b.id === id);
  if (bookingIndex === -1) {
    throw new Error('Бронирование не найдено');
  }

  // Обновляем бронирование
  const updatedBooking = {
    ...bookings[bookingIndex],
    ...data,
    updatedAt: new Date().toISOString()
  };

  bookings[bookingIndex] = updatedBooking;
  
  return updatedBooking;
}

// Удалить бронирование
export async function deleteBooking(id: number): Promise<boolean> {
  const initialLength = bookings.length;
  bookings = bookings.filter(b => b.id !== id);
  return bookings.length < initialLength;
}

// Обновить статус оплаты бронирования
export async function updatePaymentStatus(id: number, status: PaymentStatus, paidAmount: number): Promise<Booking> {
  const bookingIndex = bookings.findIndex(b => b.id === id);
  if (bookingIndex === -1) {
    throw new Error('Бронирование не найдено');
  }

  // Обновляем статус оплаты
  const updatedBooking = {
    ...bookings[bookingIndex],
    paymentStatus: status,
    paidAmount: paidAmount,
    updatedAt: new Date().toISOString()
  };

  bookings[bookingIndex] = updatedBooking;
  
  return updatedBooking;
}

// API ДЛЯ РАБОТЫ С ПАКЕТАМИ

// Получить все пакеты
export async function getAllPackages(): Promise<Package[]> {
  return [...packages];
}

// Получить пакет по ID
export async function getPackageById(id: string | number): Promise<Package | null> {
  const pkg = packages.find(p => p.id.toString() === id.toString());
  return pkg || null;
}

// Создать новый пакет
export async function createPackage(data: Package): Promise<Package> {
  // Проверяем уникальность ID
  if (packages.some(p => p.id.toString() === data.id.toString())) {
    throw new Error('Пакет с таким ID уже существует');
  }

  packages.push(data);
  return data;
}

// Обновить существующий пакет
export async function updatePackage(id: string | number, data: Partial<Package>): Promise<Package> {
  const packageIndex = packages.findIndex(p => p.id.toString() === id.toString());
  if (packageIndex === -1) {
    throw new Error('Пакет не найден');
  }

  // Обновляем пакет
  packages[packageIndex] = {
    ...packages[packageIndex],
    ...data
  };
  
  return packages[packageIndex];
}

// Удалить пакет
export async function deletePackage(id: string | number): Promise<boolean> {
  const initialLength = packages.length;
  packages = packages.filter(p => p.id.toString() !== id.toString());
  return packages.length < initialLength;
}

// API ДЛЯ РАБОТЫ С КОМНАТАМИ

// Получить все комнаты
export async function getAllRooms(): Promise<Room[]> {
  return [...rooms];
}

// Получить комнату по ID
export async function getRoomById(id: number): Promise<Room | null> {
  const room = rooms.find(r => r.id === id);
  return room || null;
}

// Создать новую комнату
export async function createRoom(data: Partial<Room>): Promise<Room> {
  const newId = Math.max(...rooms.map(r => r.id)) + 1;
  
  const newRoom: Room = {
    id: newId,
    name: data.name || `Новая комната ${newId}`,
    capacity: data.capacity || 10,
    maxPeople: data.maxPeople || 6,
    available: data.available !== undefined ? data.available : true,
    isActive: data.isActive !== undefined ? data.isActive : true,
    workSchedule: data.workSchedule || getDefaultWorkSchedule()
  };

  rooms.push(newRoom);
  return newRoom;
}

// Обновить существующую комнату
export async function updateRoom(id: number, data: Partial<Room>): Promise<Room> {
  const roomIndex = rooms.findIndex(r => r.id === id);
  if (roomIndex === -1) {
    throw new Error('Комната не найдена');
  }

  // Обновляем комнату
  rooms[roomIndex] = {
    ...rooms[roomIndex],
    ...data
  };
  
  return rooms[roomIndex];
}

// Удалить комнату
export async function deleteRoom(id: number): Promise<boolean> {
  const initialLength = rooms.length;
  rooms = rooms.filter(r => r.id !== id);
  return rooms.length < initialLength;
}

// ФУНКЦИИ ДЛЯ РАБОТЫ С ДОСТУПНОСТЬЮ

// Проверить доступность комнаты на указанную дату и время
export async function isRoomAvailable(roomId: number, date: string, startTime: string, endTime: string): Promise<boolean> {
  const room = await getRoomById(roomId);
  if (!room || !room.isActive || !room.available) {
    return false;
  }

  // Проверяем расписание работы комнаты
  const dayOfWeek = new Date(date).getDay();
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const dayName = dayNames[dayOfWeek];
  const daySchedule = room.workSchedule[dayName as keyof typeof room.workSchedule];

  // Проверяем, работает ли комната в этот день
  if (!daySchedule || !daySchedule.isActive) {
    return false;
  }

  // Проверяем, попадает ли время бронирования в рабочие часы комнаты
  if (startTime < daySchedule.startTime || endTime > daySchedule.endTime) {
    return false;
  }

  // Проверяем, нет ли уже бронирований для этой комнаты в это время
  const roomBookings = bookings.filter(b => 
    b.roomId === roomId && 
    b.date === date
  );

  // Проверяем пересечение времени
  const startMinutes = timeToMinutes(startTime);
  const endMinutes = timeToMinutes(endTime);

  for (const booking of roomBookings) {
    const bookingStartMinutes = timeToMinutes(booking.startTime);
    const bookingEndMinutes = timeToMinutes(booking.endTime);

    // Проверяем пересечение интервалов
    if (
      (startMinutes >= bookingStartMinutes && startMinutes < bookingEndMinutes) || // Начало нового бронирования внутри существующего
      (endMinutes > bookingStartMinutes && endMinutes <= bookingEndMinutes) || // Конец нового бронирования внутри существующего
      (startMinutes <= bookingStartMinutes && endMinutes >= bookingEndMinutes) // Новое бронирование полностью перекрывает существующее
    ) {
      return false;
    }
  }

  return true;
}

// Получить доступные временные слоты для указанной даты и пакета
export async function getAvailableTimeSlots(date: string, packageId: string): Promise<TimeSlot[]> {
  const pkg = await getPackageById(packageId);
  if (!pkg) {
    throw new Error('Пакет не найден');
  }

  const allRooms = await getAllRooms();
  const activeRooms = allRooms.filter(r => r.isActive && r.available);

  // Определяем день недели для проверки рабочих часов комнат
  const dayOfWeek = new Date(date).getDay();
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const dayName = dayNames[dayOfWeek];

  // Получаем все бронирования на эту дату
  const dateBookings = await getBookingsByDate(date);

  // Создаем временные слоты с интервалом в 30 минут, начиная с 10:00 до 22:00
  // Это стандартное время работы, но мы учтем фактическое расписание каждой комнаты
  const timeSlots: TimeSlot[] = [];
  const startMinutes = 10 * 60; // 10:00
  const endMinutes = 22 * 60; // 22:00
  const slotInterval = 30; // 30 минут

  for (let minutes = startMinutes; minutes < endMinutes - pkg.duration; minutes += slotInterval) {
    const startTime = minutesToTime(minutes);
    const endTime = calculateEndTime(startTime, pkg.duration);
    
    // Проверяем, какие комнаты доступны для этого временного слота
    const availableRooms: number[] = [];
    
    for (const room of activeRooms) {
      // Проверяем подходит ли комната для пакета по вместимости
      if (room.maxPeople < pkg.maxPeople) {
        continue;
      }
      
      // Проверяем, работает ли комната в этот день и время
      const daySchedule = room.workSchedule[dayName as keyof typeof room.workSchedule];
      if (!daySchedule || !daySchedule.isActive) {
        continue;
      }
      
      // Проверяем, попадает ли время бронирования в рабочие часы комнаты
      if (startTime < daySchedule.startTime || endTime > daySchedule.endTime) {
        continue;
      }
      
      // Проверяем, нет ли уже бронирований для этой комнаты в это время
      const isAvailable = await isRoomAvailable(room.id, date, startTime, endTime);
      if (isAvailable) {
        availableRooms.push(room.id);
      }
    }
    
    // Создаем временной слот, если есть доступные комнаты
    if (availableRooms.length > 0) {
      timeSlots.push({
        id: `${date}-${startTime}`,
        startTime,
        endTime,
        available: true,
        availableRooms
      });
    }
  }
  
  return timeSlots;
}

// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ

// Применение промокода
export async function applyPromoCode(price: number, promoCode?: string): Promise<{ price: number, discount?: number }> {
  if (!promoCode) return { price };
  
  const promoCodeUpperCase = promoCode.toUpperCase();
  const promoCodeObj = promoCodes.find(p => p.code === promoCodeUpperCase && p.isActive);
  
  if (!promoCodeObj) {
    return { price };
  }
  
  const discount = promoCodeObj.discountPercent;
  const discountedPrice = price * (1 - discount / 100);
  
  return { 
    price: Math.round(discountedPrice * 100) / 100, 
    discount 
  };
}

// API ДЛЯ КРОСС-СЕЛЛА

// Получить все товары для кросс-селла
export async function getAllCrossSellItems(): Promise<typeof crossSellItems> {
  return crossSellItems.filter(item => item.isActive);
}

// Получить товар по ID
export async function getCrossSellItemById(id: string): Promise<typeof crossSellItems[0] | null> {
  const item = crossSellItems.find(item => item.id === id);
  return item || null;
}

// АНАЛИТИКА

// Получить данные для аналитики
export async function getBookingAnalytics() {
  const allBookings = await getAllBookings();
  
  // Базовая статистика
  const totalBookings = allBookings.length;
  const fullyPaidBookings = allBookings.filter(b => b.paymentStatus === 'FULLY_PAID').length;
  const depositPaidBookings = allBookings.filter(b => b.paymentStatus === 'DEPOSIT_PAID').length;
  const unpaidBookings = allBookings.filter(b => b.paymentStatus === 'UNPAID').length;
  
  // Расчет общей выручки
  const totalRevenue = allBookings.reduce((sum, booking) => sum + (booking.paidAmount || 0), 0);
  
  // Статистика по пакетам
  const packageStats: Record<string, { bookingsCount: number; revenue: number }> = {};
  
  for (const booking of allBookings) {
    const packageId = booking.packageId.toString();
    
    if (!packageStats[packageId]) {
      packageStats[packageId] = {
        bookingsCount: 0,
        revenue: 0
      };
    }
    
    packageStats[packageId].bookingsCount += 1;
    packageStats[packageId].revenue += booking.paidAmount || 0;
  }
  
  return {
    totalBookings,
    fullyPaidBookings,
    depositPaidBookings,
    unpaidBookings,
    totalRevenue,
    packageStats
  };
}

// Сбросить все данные к исходному состоянию (для тестирования)
export function resetMockData() {
  bookings = [...mockBookings];
  packages = [...mockPackages];
  rooms = [...mockRooms];
  promoCodes = [...mockPromoCodes];
  crossSellItems = [...mockCrossSellItems];
} 