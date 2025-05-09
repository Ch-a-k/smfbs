/**
 * Файл с моковыми данными для фронтенда
 * Это позволит приложению работать без реального API
 */

import { format, addDays, subDays } from 'date-fns';
import { Booking, PaymentStatus } from '@/types/booking';
import { Customer } from '@/types/customer';

// Типы для комнат
export interface DaySchedule {
  startTime: string;
  endTime: string;
  isActive: boolean;
}

export interface RoomSchedule {
  monday: DaySchedule;
  tuesday: DaySchedule;
  wednesday: DaySchedule;
  thursday: DaySchedule;
  friday: DaySchedule;
  saturday: DaySchedule;
  sunday: DaySchedule;
}

export interface Room {
  id: number;
  name: string;
  capacity: number;
  maxPeople?: number;
  available: boolean;
  isActive: boolean;
  description: string;
  image: string;
  workSchedule: RoomSchedule;
}

// Типы для пакетов
export interface Package {
  id: number;
  name: string;
  description: string;
  price: number;
  durationMinutes: number;
  maxPeople: number;
  depositAmount: number;
  isActive: boolean;
  preferredRooms?: number[];
  roomId?: number;
  image?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Типы для промокодов
export enum PromoCodeType {
  PERCENT = 'PERCENT',
  AMOUNT = 'AMOUNT'
}

export interface PromoCode {
  code: string;
  discountValue: number;
  type: PromoCodeType;
  isActive: boolean;
  usageLimit?: number;
  currentUsageCount?: number;
  expires?: string;
}

// Типы для кросс-продаж
export interface CrossSellItem {
  id: number;
  name: string;
  description: string;
  price: number;
  isActive: boolean;
  image?: string;
  icon?: string;
}

// Моковые данные для комнат
export const mockRooms: Room[] = [
  {
    id: 1,
    name: 'Pokój 1',
    capacity: 6,
    maxPeople: 8,
    available: true,
    isActive: true,
    description: 'Standardowy pokój do destrukcji',
    image: '/images/room1.jpg',
    workSchedule: {
      monday: { startTime: '10:00', endTime: '22:00', isActive: true },
      tuesday: { startTime: '10:00', endTime: '22:00', isActive: true },
      wednesday: { startTime: '10:00', endTime: '22:00', isActive: true },
      thursday: { startTime: '10:00', endTime: '22:00', isActive: true },
      friday: { startTime: '10:00', endTime: '22:00', isActive: true },
      saturday: { startTime: '10:00', endTime: '22:00', isActive: true },
      sunday: { startTime: '10:00', endTime: '22:00', isActive: true },
    }
  },
  {
    id: 2,
    name: 'Pokój 2',
    capacity: 6,
    maxPeople: 8,
    available: true,
    isActive: true,
    description: 'Standardowy pokój do destrukcji',
    image: '/images/room2.jpg',
    workSchedule: {
      monday: { startTime: '10:00', endTime: '22:00', isActive: true },
      tuesday: { startTime: '10:00', endTime: '22:00', isActive: true },
      wednesday: { startTime: '10:00', endTime: '22:00', isActive: true },
      thursday: { startTime: '10:00', endTime: '22:00', isActive: true },
      friday: { startTime: '10:00', endTime: '22:00', isActive: true },
      saturday: { startTime: '10:00', endTime: '22:00', isActive: true },
      sunday: { startTime: '10:00', endTime: '22:00', isActive: true },
    }
  },
  {
    id: 3,
    name: 'Pokój 3',
    capacity: 6,
    maxPeople: 8,
    available: true,
    isActive: true,
    description: 'Standardowy pokój do destrukcji',
    image: '/images/room3.jpg',
    workSchedule: {
      monday: { startTime: '10:00', endTime: '22:00', isActive: true },
      tuesday: { startTime: '10:00', endTime: '22:00', isActive: true },
      wednesday: { startTime: '10:00', endTime: '22:00', isActive: true },
      thursday: { startTime: '10:00', endTime: '22:00', isActive: true },
      friday: { startTime: '10:00', endTime: '22:00', isActive: true },
      saturday: { startTime: '10:00', endTime: '22:00', isActive: true },
      sunday: { startTime: '10:00', endTime: '22:00', isActive: true },
    }
  },
  {
    id: 4,
    name: 'Pokój 4',
    capacity: 6,
    maxPeople: 8,
    available: true,
    isActive: true,
    description: 'Standardowy pokój do destrukcji',
    image: '/images/room4.jpg',
    workSchedule: {
      monday: { startTime: '10:00', endTime: '22:00', isActive: true },
      tuesday: { startTime: '10:00', endTime: '22:00', isActive: true },
      wednesday: { startTime: '10:00', endTime: '22:00', isActive: true },
      thursday: { startTime: '10:00', endTime: '22:00', isActive: true },
      friday: { startTime: '10:00', endTime: '22:00', isActive: true },
      saturday: { startTime: '10:00', endTime: '22:00', isActive: true },
      sunday: { startTime: '10:00', endTime: '22:00', isActive: true },
    }
  }
];

// Моковые данные для пакетов
export const mockPackages: Package[] = [
  {
    id: 1,
    name: 'TRUDNY',
    description: 'Trudny pakiet dla odważnych',
    price: 999,
    durationMinutes: 180,
    maxPeople: 8,
    depositAmount: 250,
    isActive: true,
    preferredRooms: [1, 2, 3, 4],
    image: '/images/package1.jpg'
  },
  {
    id: 2,
    name: 'ŚREDNI',
    description: 'Średni poziom trudności',
    price: 499,
    durationMinutes: 120,
    maxPeople: 8,
    depositAmount: 150,
    isActive: true,
    preferredRooms: [1, 2, 3, 4],
    image: '/images/package2.jpg'
  },
  {
    id: 3,
    name: 'ŁATWY',
    description: 'Łatwy pakiet dla początkujących',
    price: 299,
    durationMinutes: 45,
    maxPeople: 8,
    depositAmount: 100,
    isActive: true,
    preferredRooms: [1, 2, 3, 4],
    image: '/images/package3.jpg'
  },
  {
    id: 4,
    name: 'BUŁKA Z MASŁEM',
    description: 'Najprostszy pakiet dla dzieci i nowicjuszy',
    price: 199,
    durationMinutes: 30,
    maxPeople: 8,
    depositAmount: 50,
    isActive: true,
    preferredRooms: [1, 2, 3, 4],
    image: '/images/package4.jpg'
  }
];

// Моковые данные для промокодов
export const mockPromoCodes: PromoCode[] = [
  {
    code: 'RABAT10',
    discountValue: 10,
    type: PromoCodeType.PERCENT,
    isActive: true,
    usageLimit: 100,
    currentUsageCount: 45,
    expires: '2024-12-31'
  },
  {
    code: 'ZIMA2023',
    discountValue: 50,
    type: PromoCodeType.AMOUNT,
    isActive: true,
    usageLimit: 50,
    currentUsageCount: 12,
    expires: '2023-12-31'
  },
  {
    code: 'WELCOME20',
    discountValue: 20,
    type: PromoCodeType.PERCENT,
    isActive: true
  }
];

// Моковые данные для кросс-продаж
export const mockCrossSellItems: CrossSellItem[] = [
  {
    id: 1,
    name: 'Tort urodzinowy',
    description: 'Pyszny tort urodzinowy na Twoją imprezę',
    price: 120,
    isActive: true,
    icon: 'cake'
  },
  {
    id: 2,
    name: 'Fotograf',
    description: '1 godzina pracy profesjonalnego fotografa',
    price: 200,
    isActive: true,
    icon: 'camera'
  },
  {
    id: 3,
    name: 'Dekoracje',
    description: 'Dekoracje sali w wybranym stylu',
    price: 150,
    isActive: true,
    icon: 'party-popper'
  },
  {
    id: 4,
    name: 'Catering',
    description: 'Zestaw przekąsek i napojów',
    price: 250,
    isActive: true,
    icon: 'utensils'
  }
];

// Моковые данные для бронирований
export const mockBookings: any[] = [
  {
    id: 1,
    packageId: 2,
    packageName: 'ŚREDNI',
    roomId: 1,
    roomName: 'Pokój 1',
    customerName: 'Jan Kowalski',
    customerEmail: 'jan.kowalski@example.com',
    customerPhone: '+48123456789',
    date: format(new Date(), 'yyyy-MM-dd'), // сегодня
    startTime: '14:00',
    endTime: '16:00',
    numPeople: 4,
    numberOfPeople: 4,
    notes: 'Proszę o przygotowanie dodatkowych rękawic',
    comment: 'Proszę o przygotowanie dodatkowych rękawic',
    promoCode: '',
    totalPrice: 499,
    totalAmount: 499,
    paymentStatus: 'FULLY_PAID' as PaymentStatus,
    paidAmount: 499,
    depositAmount: 150,
    status: 'confirmed',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    name: 'Jan Kowalski',
    email: 'jan.kowalski@example.com',
    phone: '+48123456789',
    adminComment: 'Stały klient, wszystko przygotowane'
  },
  {
    id: 2,
    packageId: 1,
    packageName: 'TRUDNY',
    roomId: 2,
    roomName: 'Pokój 2',
    customerName: 'Anna Nowak',
    customerEmail: 'anna.nowak@example.com',
    customerPhone: '+48987654321',
    date: format(addDays(new Date(), 1), 'yyyy-MM-dd'), // завтра
    startTime: '10:00',
    endTime: '13:00',
    numPeople: 6,
    numberOfPeople: 6,
    notes: 'Rezerwacja dla grupy przyjaciół',
    comment: 'Rezerwacja dla grupy przyjaciół',
    promoCode: 'RABAT10',
    totalPrice: 899,
    totalAmount: 899,
    paymentStatus: 'DEPOSIT_PAID' as PaymentStatus,
    paidAmount: 250,
    depositAmount: 250,
    status: 'confirmed',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    name: 'Anna Nowak',
    email: 'anna.nowak@example.com',
    phone: '+48987654321',
    adminComment: ''
  },
  {
    id: 3,
    packageId: 3,
    packageName: 'ŁATWY',
    roomId: 3,
    roomName: 'Pokój 3',
    customerName: 'Piotr Wiśniewski',
    customerEmail: 'piotr.wisniewski@example.com',
    customerPhone: '+48567891234',
    date: format(subDays(new Date(), 1), 'yyyy-MM-dd'), // вчера
    startTime: '16:00',
    endTime: '16:45',
    numPeople: 2,
    numberOfPeople: 2,
    notes: '',
    comment: '',
    promoCode: '',
    totalPrice: 299,
    totalAmount: 299,
    paymentStatus: 'UNPAID' as PaymentStatus,
    paidAmount: 0,
    depositAmount: 100,
    status: 'confirmed',
    createdAt: subDays(new Date(), 2).toISOString(),
    updatedAt: subDays(new Date(), 2).toISOString(),
    name: 'Piotr Wiśniewski',
    email: 'piotr.wisniewski@example.com',
    phone: '+48567891234',
    adminComment: 'Klient wymaga kontaktu telefonicznego'
  },
  {
    id: 4,
    packageId: 4,
    packageName: 'BUŁKA Z MASŁEM',
    roomId: 4,
    roomName: 'Pokój 4',
    customerName: 'Magdalena Kowalczyk',
    customerEmail: 'magdalena.kowalczyk@example.com',
    customerPhone: '+48321654987',
    date: format(addDays(new Date(), 3), 'yyyy-MM-dd'), // через 3 дня
    startTime: '12:00',
    endTime: '12:30',
    numPeople: 3,
    numberOfPeople: 3,
    notes: 'Urodziny dziecka',
    comment: 'Urodziny dziecka',
    promoCode: '',
    totalPrice: 199,
    totalAmount: 199,
    paymentStatus: 'FULLY_PAID' as PaymentStatus,
    paidAmount: 199,
    depositAmount: 50,
    status: 'confirmed',
    createdAt: subDays(new Date(), 5).toISOString(),
    updatedAt: subDays(new Date(), 5).toISOString(),
    name: 'Magdalena Kowalczyk',
    email: 'magdalena.kowalczyk@example.com',
    phone: '+48321654987',
    adminComment: 'Przygotować uroczyście'
  }
];

// Моковые данные для клиентов
export const mockCustomers: Customer[] = [
  {
    id: 1,
    name: 'Jan Kowalski',
    email: 'jan.kowalski@example.com',
    phone: '+48123456789',
    address: 'ul. Warszawska 10/5',
    city: 'Kraków',
    postalCode: '30-001',
    country: 'Poland',
    notes: 'Stały klient, lubi trudne wyzwania',
    bookingsCount: 3,
    totalSpent: 1497,
    firstBookingDate: subDays(new Date(), 60).toISOString(),
    lastBookingDate: new Date().toISOString(),
    isVip: true,
    createdAt: subDays(new Date(), 90).toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 2,
    name: 'Anna Nowak',
    email: 'anna.nowak@example.com',
    phone: '+48987654321',
    address: 'ul. Krakowska 25',
    city: 'Warszawa',
    postalCode: '00-180',
    country: 'Poland',
    notes: 'Przychodzi z grupą przyjaciół',
    bookingsCount: 2,
    totalSpent: 1398,
    firstBookingDate: subDays(new Date(), 30).toISOString(),
    lastBookingDate: addDays(new Date(), 1).toISOString(),
    isVip: false,
    createdAt: subDays(new Date(), 45).toISOString(),
    updatedAt: addDays(new Date(), 1).toISOString()
  },
  {
    id: 3,
    name: 'Piotr Wiśniewski',
    email: 'piotr.wisniewski@example.com',
    phone: '+48567891234',
    address: 'ul. Długa 7',
    city: 'Gdańsk',
    postalCode: '80-001',
    country: 'Poland',
    notes: 'Klient wymaga kontaktu telefonicznego',
    bookingsCount: 1,
    totalSpent: 299,
    firstBookingDate: subDays(new Date(), 1).toISOString(),
    lastBookingDate: subDays(new Date(), 1).toISOString(),
    isVip: false,
    createdAt: subDays(new Date(), 5).toISOString(),
    updatedAt: subDays(new Date(), 1).toISOString()
  },
  {
    id: 4,
    name: 'Magdalena Kowalczyk',
    email: 'magdalena.kowalczyk@example.com',
    phone: '+48321654987',
    address: 'ul. Nowa 15/3',
    city: 'Poznań',
    postalCode: '60-001',
    country: 'Poland',
    notes: 'Rezerwuje pokoje na urodziny dzieci',
    bookingsCount: 1,
    totalSpent: 199,
    firstBookingDate: addDays(new Date(), 3).toISOString(),
    lastBookingDate: addDays(new Date(), 3).toISOString(),
    isVip: false,
    createdAt: subDays(new Date(), 5).toISOString(),
    updatedAt: subDays(new Date(), 5).toISOString()
  },
  {
    id: 5,
    name: 'Tomasz Lewandowski',
    email: 'tomasz.lewandowski@example.com',
    phone: '+48555666777',
    address: 'ul. Słoneczna 8',
    city: 'Wrocław',
    postalCode: '50-001',
    country: 'Poland',
    notes: 'Organizator imprez firmowych',
    bookingsCount: 5,
    totalSpent: 3495,
    firstBookingDate: subDays(new Date(), 120).toISOString(),
    lastBookingDate: addDays(new Date(), 14).toISOString(),
    isVip: true,
    createdAt: subDays(new Date(), 180).toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// Генерация даты в правильном формате
const todayFormatted = format(new Date(), 'yyyy-MM-dd');
const yesterdayFormatted = format(subDays(new Date(), 1), 'yyyy-MM-dd');
const tomorrowFormatted = format(addDays(new Date(), 1), 'yyyy-MM-dd');

// Функция для расчета времени окончания на основе времени начала и продолжительности в минутах
export const calculateEndTime = (startTime: string, durationMinutes: number): string => {
  // Парсим время начала
  const [hours, minutes] = startTime.split(':').map(Number);
  
  // Рассчитываем новое время
  let endHours = hours + Math.floor(durationMinutes / 60);
  let endMinutes = minutes + (durationMinutes % 60);
  
  // Обрабатываем перенос минут
  if (endMinutes >= 60) {
    endHours += 1;
    endMinutes -= 60;
  }
  
  // Форматируем время
  return `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
};

// Функция для получения стандартного расписания работы
export const getDefaultWorkSchedule = (): RoomSchedule => {
  const defaultSchedule: DaySchedule = { startTime: '10:00', endTime: '22:00', isActive: true };
  return {
    monday: { ...defaultSchedule },
    tuesday: { ...defaultSchedule },
    wednesday: { ...defaultSchedule },
    thursday: { ...defaultSchedule },
    friday: { ...defaultSchedule },
    saturday: { ...defaultSchedule },
    sunday: { ...defaultSchedule }
  };
};

// Функция для генерации уникального ID
export const generateId = (): number => {
  return Date.now() + Math.floor(Math.random() * 1000);
};

// Функция для получения доступных слотов времени на указанную дату
export const getAvailableTimeSlots = (date: string, packageId: number | string) => {
  const packageIdNum = typeof packageId === 'string' ? parseInt(packageId, 10) : packageId;
  const selectedPackage = mockPackages.find(p => p.id === packageIdNum);
  
  if (!selectedPackage) {
    throw new Error('Pakiet nie znaleziony');
  }
  
  // Получаем все бронирования на указанную дату
  const bookingsForDate = mockBookings.filter(b => b.date === date);
  
  // Генерируем все возможные слоты времени (с шагом 30 минут)
  const allSlots = [];
  const room = mockRooms[0]; // Используем расписание первой комнаты
  
  // Определяем день недели для выбранной даты
  const dayOfWeek = new Date(date).getDay();
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const daySchedule = room.workSchedule[dayNames[dayOfWeek] as keyof RoomSchedule];
  
  if (!daySchedule.isActive) {
    return []; // В этот день комната закрыта
  }
  
  // Получаем время работы комнаты
  const startHour = parseInt(daySchedule.startTime.split(':')[0]);
  const startMinute = parseInt(daySchedule.startTime.split(':')[1]);
  const endHour = parseInt(daySchedule.endTime.split(':')[0]);
  const endMinute = parseInt(daySchedule.endTime.split(':')[1]);
  
  // Создаем временные метки для генерации слотов
  let currentHour = startHour;
  let currentMinute = startMinute;
  
  // Шаг слотов в минутах
  const slotStep = 30;
  
  // Генерируем все возможные слоты времени
  while (currentHour < endHour || (currentHour === endHour && currentMinute < endMinute)) {
    // Форматируем время начала слота
    const startTimeFormatted = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
    
    // Рассчитываем время окончания слота
    const endTimeFormatted = calculateEndTime(startTimeFormatted, selectedPackage.durationMinutes);
    
    // Проверяем, не выходит ли слот за пределы рабочего времени
    const [endHour, endMin] = endTimeFormatted.split(':').map(Number);
    
    if (endHour < endHour || (endHour === endHour && endMin <= endMinute)) {
      // Проверяем, не занят ли слот уже существующими бронированиями
      const isSlotAvailable = !bookingsForDate.some(booking => {
        const bookingStart = booking.startTime;
        const bookingEnd = booking.endTime;
        
        // Проверяем, пересекается ли новый слот с существующим бронированием
        return (
          (startTimeFormatted < bookingEnd && endTimeFormatted > bookingStart) ||
          startTimeFormatted === bookingStart ||
          endTimeFormatted === bookingEnd
        );
      });
      
      if (isSlotAvailable) {
        // Находим все доступные комнаты для этого слота
        const availableRooms = mockRooms.filter(room => {
          if (!room.isActive || !room.available) return false;
          
          // Проверяем, не занята ли комната в это время
          return !bookingsForDate.some(booking => {
            return booking.roomId === room.id &&
                  ((startTimeFormatted < booking.endTime && endTimeFormatted > booking.startTime) ||
                   startTimeFormatted === booking.startTime ||
                   endTimeFormatted === booking.endTime);
          });
        }).map(room => room.id);
        
        allSlots.push({
          startTime: startTimeFormatted,
          endTime: endTimeFormatted,
          availableRooms
        });
      }
    }
    
    // Переходим к следующему слоту
    currentMinute += slotStep;
    if (currentMinute >= 60) {
      currentHour += 1;
      currentMinute -= 60;
    }
  }
  
  return allSlots;
};

// Функции для работы с API

// Получение списка комнат
export const fetchRooms = async () => {
  return Promise.resolve({ rooms: mockRooms });
};

// Получение списка пакетов
export const fetchPackages = async () => {
  return Promise.resolve({ packages: mockPackages });
};

// Получение списка бронирований
export const fetchBookings = async () => {
  return Promise.resolve(mockBookings);
};

// Создание нового бронирования
export const createBooking = async (bookingData: any) => {
  console.log('MOCK API: Создание бронирования с данными:', bookingData);
  
  try {
    // Проверка обязательных полей
    if (!bookingData.packageId) throw new Error('Не указан ID пакета');
    if (!bookingData.roomId) throw new Error('Не указана комната');
    if (!bookingData.date && !bookingData.booking_date) throw new Error('Не указана дата');
    if (!bookingData.customerName && !bookingData.name) throw new Error('Не указано имя клиента');
    
    // Генерируем ID для нового бронирования
    const newId = generateId();
    console.log('MOCK API: Сгенерирован ID для нового бронирования:', newId);
    
    // Получаем информацию о комнате и пакете
    const room = mockRooms.find(r => r.id === Number(bookingData.roomId));
    const pkg = mockPackages.find(p => p.id === Number(bookingData.packageId));
    
    if (!room) {
      console.error('MOCK API: Комната не найдена:', bookingData.roomId);
      throw new Error(`Комната с ID ${bookingData.roomId} не найдена`);
    }
    
    if (!pkg) {
      console.error('MOCK API: Пакет не найден:', bookingData.packageId);
      throw new Error(`Пакет с ID ${bookingData.packageId} не найден`);
    }
    
    // Создаем новое бронирование
    const newBooking = {
      ...bookingData,
      id: newId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      // Добавляем поля, которые могут отсутствовать в bookingData
      date: bookingData.date || bookingData.booking_date,
      roomName: room.name,
      packageName: pkg.name,
      // Гарантируем наличие всех необходимых полей
      name: bookingData.name || bookingData.customerName,
      customerName: bookingData.customerName || bookingData.name,
      customerEmail: bookingData.customerEmail || bookingData.email,
      customerPhone: bookingData.customerPhone || bookingData.phone,
      totalPrice: bookingData.totalPrice || bookingData.totalAmount || pkg.price,
      totalAmount: bookingData.totalAmount || bookingData.totalPrice || pkg.price,
      status: 'confirmed'
    };
    
    mockBookings.push(newBooking);
    console.log('MOCK API: Создано новое бронирование:', newBooking);
    
    return Promise.resolve({ booking: newBooking, message: 'Rezerwacja utworzona pomyślnie' });
  } catch (error) {
    console.error('MOCK API: Ошибка при создании бронирования:', error);
    return Promise.reject(error);
  }
};

// Обновление бронирования
export const updateBooking = async (bookingData: any) => {
  const index = mockBookings.findIndex(b => b.id === bookingData.id);
  
  if (index === -1) {
    return Promise.reject(new Error('Rezerwacja nie znaleziona'));
  }
  
  // Обновляем бронирование, сохраняя существующие поля
  const updatedBooking = { 
    ...mockBookings[index], 
    ...bookingData,
    updatedAt: new Date().toISOString()
  };
  
  mockBookings[index] = updatedBooking;
  console.log('Обновлено бронирование:', updatedBooking);
  
  return Promise.resolve({ booking: updatedBooking, message: 'Rezerwacja zaktualizowana pomyślnie' });
};

// Удаление бронирования
export const deleteBooking = async (bookingId: number) => {
  const index = mockBookings.findIndex(b => b.id === bookingId);
  
  if (index === -1) {
    return Promise.reject(new Error('Rezerwacja nie znaleziona'));
  }
  
  const deletedBooking = mockBookings.splice(index, 1)[0];
  console.log('Удалено бронирование:', deletedBooking);
  
  return Promise.resolve({ booking: deletedBooking, message: 'Rezerwacja usunięta pomyślnie' });
};

// Получение доступных слотов времени
export const fetchAvailableTimeSlots = async (date: string, packageId: number) => {
  try {
    const timeSlots = getAvailableTimeSlots(date, packageId);
    return Promise.resolve({ timeSlots });
  } catch (error) {
    return Promise.reject(error);
  }
};

// Проверка промокода
export const validatePromoCode = async (code: string, price: number) => {
  const promoCode = mockPromoCodes.find(pc => pc.code === code && pc.isActive);
  
  if (!promoCode) {
    return Promise.reject(new Error('Kod promocyjny jest nieważny'));
  }
  
  let discountedPrice = price;
  
  if (promoCode.type === PromoCodeType.PERCENT) {
    discountedPrice = price - (price * promoCode.discountValue / 100);
  } else if (promoCode.type === PromoCodeType.AMOUNT) {
    discountedPrice = price - promoCode.discountValue;
    if (discountedPrice < 0) discountedPrice = 0;
  }
  
  return Promise.resolve({
    originalPrice: price,
    discountedPrice,
    discount: price - discountedPrice,
    promoCode
  });
};

// Получение списка товаров для кросс-продаж
export const fetchCrossSellItems = async () => {
  return Promise.resolve({ items: mockCrossSellItems });
};

// Получение аналитики
export const fetchAnalytics = async () => {
  // Данные для аналитики
  const currentMonthBookings = mockBookings.filter(b => {
    const bookingDate = new Date(b.date);
    const currentDate = new Date();
    return bookingDate.getMonth() === currentDate.getMonth() &&
           bookingDate.getFullYear() === currentDate.getFullYear();
  });
  
  const totalRevenue = mockBookings.reduce((sum, booking) => 
    sum + (booking.totalAmount || 0), 0);
  
  const paidRevenue = mockBookings.reduce((sum, booking) => 
    sum + (booking.paidAmount || 0), 0);
  
  return Promise.resolve({
    totalBookings: mockBookings.length,
    currentMonthBookings: currentMonthBookings.length,
    totalRevenue,
    paidRevenue,
    pendingPayments: totalRevenue - paidRevenue,
    popularRooms: [
      { roomId: 1, name: 'Sala Flamingo', bookingsCount: 2 },
      { roomId: 2, name: 'Sala Deluxe', bookingsCount: 1 },
      { roomId: 3, name: 'Sala VIP', bookingsCount: 1 }
    ],
    popularPackages: [
      { packageId: 3, name: 'Pakiet Urodzinowy', bookingsCount: 2 },
      { packageId: 1, name: 'Pakiet Standard', bookingsCount: 1 },
      { packageId: 2, name: 'Pakiet Premium', bookingsCount: 1 }
    ]
  });
};

// Функция для получения списка клиентов
export const fetchCustomers = async (): Promise<Customer[]> => {
  // Имитация задержки сети
  await new Promise(resolve => setTimeout(resolve, 500));
  return mockCustomers;
};

// Функция для создания нового клиента
export const createCustomer = async (customerData: Omit<Customer, 'id' | 'bookingsCount' | 'totalSpent' | 'firstBookingDate' | 'lastBookingDate' | 'createdAt' | 'updatedAt'>): Promise<Customer> => {
  // Имитация задержки сети
  await new Promise(resolve => setTimeout(resolve, 800));
  
  const newCustomer: Customer = {
    ...customerData,
    id: generateId(),
    bookingsCount: 0,
    totalSpent: 0,
    firstBookingDate: '',
    lastBookingDate: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  mockCustomers.push(newCustomer);
  return newCustomer;
};

// Функция для обновления информации о клиенте
export const updateCustomer = async (customerData: Customer): Promise<Customer> => {
  // Имитация задержки сети
  await new Promise(resolve => setTimeout(resolve, 800));
  
  const index = mockCustomers.findIndex(c => c.id === customerData.id);
  
  if (index === -1) {
    throw new Error('Klient nie znaleziony');
  }
  
  const updatedCustomer: Customer = {
    ...customerData,
    updatedAt: new Date().toISOString()
  };
  
  mockCustomers[index] = updatedCustomer;
  return updatedCustomer;
};

// Функция для удаления клиента
export const deleteCustomer = async (customerId: number): Promise<void> => {
  // Имитация задержки сети
  await new Promise(resolve => setTimeout(resolve, 800));
  
  const index = mockCustomers.findIndex(c => c.id === customerId);
  
  if (index === -1) {
    throw new Error('Klient nie znaleziony');
  }
  
  mockCustomers.splice(index, 1);
}; 