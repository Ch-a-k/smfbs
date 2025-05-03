import { Booking, Room, Package } from '@/types/booking';

// ПРИМЕЧАНИЕ: Эти данные используются только для ознакомления
// В реальном приложении данные должны быть перенесены в базу данных Supabase

// Пример данных о комнатах для инициализации базы данных
export const rooms: Room[] = [
  { id: 1, name: 'Комната 1', capacity: 2, available: true },
  { id: 2, name: 'Комната 2', capacity: 2, available: true },
  { id: 3, name: 'Комната 3', capacity: 4, available: true },
  { id: 4, name: 'Комната 4', capacity: 6, available: true },
];

// Пример данных о пакетах для инициализации базы данных
export const packages: Package[] = [
  { 
    id: 'bulka', 
    name: 'BUŁKA Z MASŁEM', 
    description: 'Легкий пакет', 
    price: 199, 
    depositAmount: 50, 
    duration: 30, 
    maxPeople: 2,
    preferredRooms: [1, 2, 3]
  },
  { 
    id: 'latwy', 
    name: 'ŁATWY', 
    description: 'Простой пакет', 
    price: 299, 
    depositAmount: 75, 
    duration: 45, 
    maxPeople: 2,
    preferredRooms: [1, 2, 3]
  },
  { 
    id: 'sredni', 
    name: 'ŚREDNI', 
    description: 'Средний пакет', 
    price: 499, 
    depositAmount: 100, 
    duration: 120, 
    maxPeople: 4,
    preferredRooms: [1, 2, 3]
  },
  { 
    id: 'trudny', 
    name: 'TRUDNY', 
    description: 'Сложный пакет', 
    price: 999, 
    depositAmount: 200, 
    duration: 180, 
    maxPeople: 6,
    preferredRooms: [4]
  }
];

// Пример промокодов для инициализации базы данных
export type PromoCode = {
  discountPercent: number;
};

export const promoCodes: Record<string, PromoCode> = {
  'HAPPYHOURS': { discountPercent: 20 }
};

// ВАЖНО: В реальном приложении временное хранилище больше не используется
// Все операции должны выполняться с базой данных Supabase
export const bookings: Booking[] = []; 