import { Booking, Package, Room, RoomSchedule, DaySchedule, PaymentStatus } from '@/types/booking';

// Функция для создания стандартного расписания работы
export function getDefaultWorkSchedule(): RoomSchedule {
  const defaultDay: DaySchedule = {
    isActive: true,
    startTime: '10:00',
    endTime: '22:00'
  };

  return {
    monday: { ...defaultDay },
    tuesday: { ...defaultDay },
    wednesday: { ...defaultDay },
    thursday: { ...defaultDay },
    friday: { ...defaultDay },
    saturday: { ...defaultDay },
    sunday: { ...defaultDay }
  };
}

// Стандартные комнаты
export const mockRooms: Room[] = [
  { 
    id: 1, 
    name: 'Pokój Dziecinny', 
    capacity: 10, 
    maxPeople: 6, 
    available: true, 
    isActive: true,
    workSchedule: getDefaultWorkSchedule()
  },
  { 
    id: 2, 
    name: 'Pokój Szkolny', 
    capacity: 12, 
    maxPeople: 8, 
    available: true, 
    isActive: true,
    workSchedule: getDefaultWorkSchedule()
  },
  { 
    id: 3, 
    name: 'Pokój Egzaminowy', 
    capacity: 15, 
    maxPeople: 10, 
    available: true, 
    isActive: true,
    workSchedule: getDefaultWorkSchedule()
  },
  { 
    id: 4, 
    name: 'Pokój Profesorski', 
    capacity: 20, 
    maxPeople: 12, 
    available: true, 
    isActive: true,
    workSchedule: getDefaultWorkSchedule()
  }
];

// Стандартные пакеты
export const mockPackages: Package[] = [
  { 
    id: 'bulka', 
    name: 'BUŁKA Z MASŁEM', 
    description: 'Idealny dla początkujących. Prosty scenariusz z podstawowymi zagadkami.', 
    price: 199, 
    depositAmount: 50, 
    duration: 30, 
    maxPeople: 4,
    preferredRooms: [1],
    isActive: true,
    isBestseller: false
  },
  { 
    id: 'latwy', 
    name: 'ŁATWY', 
    description: 'Dla osób, które chcą spróbować swoich sił w mniej wymagającym scenariuszu.', 
    price: 299, 
    depositAmount: 75, 
    duration: 45, 
    maxPeople: 6,
    preferredRooms: [1, 2],
    isActive: true,
    isBestseller: true
  },
  { 
    id: 'sredni', 
    name: 'ŚREDNI', 
    description: 'Wyzwanie dla graczy z doświadczeniem. Wymaga logicznego myślenia i współpracy.', 
    price: 399, 
    depositAmount: 100, 
    duration: 60, 
    maxPeople: 8,
    preferredRooms: [2, 3],
    isActive: true,
    isBestseller: false
  },
  { 
    id: 'trudny', 
    name: 'TRUDNY', 
    description: 'Najtrudniejszy poziom dla prawdziwych mistrzów zagadek i łamigłówek.', 
    price: 499, 
    depositAmount: 150, 
    duration: 90, 
    maxPeople: 10,
    preferredRooms: [3, 4],
    isActive: true,
    isBestseller: false
  }
];

// Примеры бронирований
export const mockBookings: Booking[] = [
  {
    id: 1,
    packageId: 2,
    packageName: 'ŁATWY',
    roomId: 1,
    roomName: 'Pokój Dziecinny',
    customerName: 'Jan Kowalski',
    customerEmail: 'jan.kowalski@example.com',
    customerPhone: '+48 123 456 789',
    date: '2024-07-15',
    startTime: '14:00',
    endTime: '15:30',
    numPeople: 4,
    notes: 'Urodziny Kasi',
    promoCode: '',
    totalPrice: 299,
    paymentStatus: 'FULLY_PAID' as PaymentStatus,
    paidAmount: 299,
    status: 'confirmed',
    createdAt: '2024-06-15T12:00:00Z',
    updatedAt: '2024-06-15T12:00:00Z',
    name: 'Jan Kowalski',
    email: 'jan.kowalski@example.com',
    phone: '+48 123 456 789',
    numberOfPeople: 4,
    totalAmount: 299
  },
  {
    id: 2,
    packageId: 3,
    packageName: 'ŚREDNI',
    roomId: 2,
    roomName: 'Pokój Szkolny',
    customerName: 'Anna Nowak',
    customerEmail: 'anna.nowak@example.com',
    customerPhone: '+48 987 654 321',
    date: '2024-07-16',
    startTime: '16:00',
    endTime: '17:30',
    numPeople: 6,
    notes: 'Spotkanie firmowe',
    promoCode: 'HAPPYHOURS',
    totalPrice: 319.20, // Со скидкой 20%
    paymentStatus: 'DEPOSIT_PAID' as PaymentStatus,
    paidAmount: 100,
    status: 'confirmed',
    createdAt: '2024-06-16T09:30:00Z',
    updatedAt: '2024-06-16T09:30:00Z',
    name: 'Anna Nowak',
    email: 'anna.nowak@example.com',
    phone: '+48 987 654 321',
    numberOfPeople: 6,
    totalAmount: 319.20,
    depositAmount: 100
  },
  {
    id: 3,
    packageId: 4,
    packageName: 'TRUDNY',
    roomId: 4,
    roomName: 'Pokój Profesorski',
    customerName: 'Piotr Wiśniewski',
    customerEmail: 'piotr.wisniewski@example.com',
    customerPhone: '+48 111 222 333',
    date: '2024-07-17',
    startTime: '18:00',
    endTime: '20:00',
    numPeople: 8,
    notes: 'Grupa zaawansowana',
    promoCode: '',
    totalPrice: 499,
    paymentStatus: 'UNPAID' as PaymentStatus,
    paidAmount: 0,
    status: 'pending',
    createdAt: '2024-06-17T14:15:00Z',
    updatedAt: '2024-06-17T14:15:00Z',
    name: 'Piotr Wiśniewski',
    email: 'piotr.wisniewski@example.com',
    phone: '+48 111 222 333',
    numberOfPeople: 8,
    totalAmount: 499,
    depositAmount: 150
  }
];

// Промокоды
export type PromoCode = {
  code: string;
  discountPercent: number;
  isActive: boolean;
};

export const mockPromoCodes: PromoCode[] = [
  { code: 'HAPPYHOURS', discountPercent: 20, isActive: true },
  { code: 'WELCOME10', discountPercent: 10, isActive: true },
  { code: 'SUMMER2024', discountPercent: 15, isActive: true },
  { code: 'EXPIRED', discountPercent: 25, isActive: false }
];

// Дополнительные товары (cross-sell)
export type CrossSellItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  isActive: boolean;
};

export const mockCrossSellItems: CrossSellItem[] = [
  { 
    id: 'photos', 
    name: 'Zdjęcia z gry', 
    description: 'Profesjonalne zdjęcia z Twojej przygody', 
    price: 49, 
    isActive: true 
  },
  { 
    id: 'certificate', 
    name: 'Certyfikat ukończenia', 
    description: 'Personalizowany certyfikat ukończenia gry', 
    price: 29, 
    isActive: true 
  },
  { 
    id: 'drinks', 
    name: 'Napoje dla graczy', 
    description: 'Zestaw napojów bezalkoholowych dla całej grupy', 
    price: 39, 
    isActive: true 
  },
  { 
    id: 'private', 
    name: 'Prywatna rezerwacja', 
    description: 'Gwarancja prywatności - tylko Twoja grupa w lokalu', 
    price: 99, 
    isActive: true 
  }
];

// Генерация нового ID для создания бронирования
export function generateNewId(): number {
  // Найти максимальный ID среди существующих бронирований
  if (mockBookings.length === 0) return 1;
  
  const maxId = Math.max(...mockBookings.map(booking => booking.id));
  return maxId + 1;
} 