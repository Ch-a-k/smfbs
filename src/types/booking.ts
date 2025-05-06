export interface Package {
  id: string | number;
  name: string;
  description: string;
  price: number | string;
  depositAmount: number;
  duration: number; // в минутах
  maxPeople: number;
  preferredRooms?: number[]; // предпочтительные комнаты для этого пакета
  isActive?: boolean; // активен ли пакет
  isBestseller?: boolean; // является ли этот пакет бестселлером
}

export interface Room {
  id: number;
  name: string;
  capacity: number;
  available: boolean;
  maxPeople: number; // максимальное количество людей
  isActive: boolean; // активна ли комната
  workSchedule: RoomSchedule; // расписание работы комнаты
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

export interface DaySchedule {
  isActive: boolean; // активен ли день
  startTime: string; // время начала работы, формат HH:MM
  endTime: string; // время окончания работы, формат HH:MM
}

export interface TimeSlot {
  id: string;
  startTime: string; // формат HH:MM
  endTime: string; // формат HH:MM
  available: boolean;
  availableRooms?: number[]; // доступные комнаты для этого временного слота
}

export interface BookingFormData {
  packageId: string | number;
  packageName?: string;
  date: string; // формат YYYY-MM-DD
  startTime: string; // формат HH:MM
  endTime: string; // формат HH:MM
  roomId: number; // выбранная комната
  name: string;
  email: string;
  phone: string;
  comment?: string;
  promoCode?: string;
  numberOfPeople: number; // количество человек
  crossSellItems?: string[];
  totalAmount?: number;
  depositAmount?: number;
  paidAmount?: number;
  discount?: number;
  // Альтернативные имена полей для API
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  numPeople?: number;
  totalPrice?: number;
}

export type PaymentStatus = 'UNPAID' | 'DEPOSIT_PAID' | 'FULLY_PAID';

export interface Booking {
  id: number;
  packageId: number;
  packageName: string;
  roomId: number;
  roomName: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  date: string;
  bookingDate?: string; // Альтернативное поле для даты бронирования
  dateDisplay?: string; // Поле для отображаемого формата даты (например, на польском языке)
  startTime: string;
  endTime: string;
  numPeople: number;
  numberOfPeople?: number; // Альтернативное поле для количества людей
  notes: string;
  comment?: string; // Альтернативное поле для комментариев
  promoCode: string;
  totalPrice: number;
  totalAmount?: number; // Альтернативное поле для суммы
  paymentStatus: PaymentStatus;
  paidAmount: number;
  depositAmount?: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  // Добавляем поля для совместимости с различными частями приложения
  name?: string; // Альтернативное поле для customerName
  email?: string; // Альтернативное поле для customerEmail
  phone?: string; // Альтернативное поле для customerPhone
}

export interface BookingAnalytics {
  totalBookings: number;
  fullyPaidBookings: number;
  depositPaidBookings: number;
  unpaidBookings: number;
  totalRevenue: number;
  packageStats: {
    [packageId: string]: {
      bookingsCount: number;
      revenue: number;
    }
  };
}

/**
 * Функция для преобразования данных из базы данных в формат объекта Room
 */
export function mapDatabaseRoomToRoom(dbRoom: any): Room {
  return {
    id: dbRoom.id,
    name: dbRoom.name,
    capacity: dbRoom.capacity || 0,
    maxPeople: dbRoom.max_people || 0,
    isActive: dbRoom.is_active !== undefined ? dbRoom.is_active : true,
    available: dbRoom.available !== undefined ? dbRoom.available : true,
    workSchedule: dbRoom.work_schedule || {}
  };
}

/**
 * Функция для преобразования данных из базы данных в формат объекта Package
 */
export function mapDatabasePackageToPackage(dbPackage: any): Package {
  return {
    id: dbPackage.id,
    name: dbPackage.name || '',
    description: dbPackage.description || '',
    price: dbPackage.price || 0,
    depositAmount: dbPackage.deposit_amount || 0,
    duration: dbPackage.duration || 60,
    maxPeople: dbPackage.max_people || 1,
    preferredRooms: dbPackage.preferred_rooms || [],
    isActive: dbPackage.is_active !== undefined ? dbPackage.is_active : true
  };
}

/**
 * Функция для преобразования данных из базы данных в формат объекта Booking
 */
export function mapDatabaseBookingToBooking(dbBooking: any): Booking {
  return {
    id: dbBooking.id,
    packageId: dbBooking.package_id,
    packageName: dbBooking.package_name || '',
    roomId: dbBooking.room_id,
    roomName: dbBooking.room_name || '',
    customerName: dbBooking.customer_name || dbBooking.name || '',
    customerEmail: dbBooking.customer_email || dbBooking.email || '',
    customerPhone: dbBooking.customer_phone || dbBooking.phone || '',
    date: dbBooking.booking_date || dbBooking.date || dbBooking.created_at,
    bookingDate: dbBooking.booking_date,
    dateDisplay: dbBooking.date_display,
    startTime: dbBooking.start_time || '',
    endTime: dbBooking.end_time || '',
    numPeople: dbBooking.num_people || dbBooking.numberOfPeople || 1,
    numberOfPeople: dbBooking.num_people || dbBooking.numberOfPeople || 1,
    notes: dbBooking.notes || '',
    comment: dbBooking.notes || dbBooking.comment || '',
    promoCode: dbBooking.promo_code || '',
    totalPrice: dbBooking.total_price || dbBooking.totalAmount || 0,
    totalAmount: dbBooking.total_price || dbBooking.totalAmount || 0,
    paymentStatus: (dbBooking.payment_status as PaymentStatus) || 'UNPAID',
    paidAmount: dbBooking.paid_amount || 0,
    depositAmount: dbBooking.deposit_amount || 0,
    status: dbBooking.status || '',
    createdAt: dbBooking.created_at || '',
    updatedAt: dbBooking.updated_at || dbBooking.created_at || '',
    name: dbBooking.customer_name || dbBooking.name || '',
    email: dbBooking.customer_email || dbBooking.email || '',
    phone: dbBooking.customer_phone || dbBooking.phone || ''
  };
}
