export interface Package {
  id: string | number;
  name: string;
  description: string;
  price: number;
  depositAmount: number;
  duration: number; // в минутах
  maxPeople: number;
  preferredRooms?: number[]; // предпочтительные комнаты для этого пакета
  isActive?: boolean; // активен ли пакет
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
}

export type PaymentStatus = 'UNPAID' | 'DEPOSIT_PAID' | 'FULLY_PAID';

export interface Booking {
  id: string | number;
  packageId: string | number;
  packageName: string;
  date: string; // формат YYYY-MM-DD
  bookingDate?: string; // альтернативное название для date в БД
  startTime: string; // формат HH:MM
  endTime: string; // формат HH:MM
  roomId: number; // номер комнаты
  name: string;
  customerName?: string; // альтернативное название для name в БД
  email: string;
  customerEmail?: string; // альтернативное название для email в БД
  phone: string;
  customerPhone?: string; // альтернативное название для phone в БД
  comment?: string;
  notes?: string; // альтернативное название для comment в БД
  promoCode?: string;
  numberOfPeople: number; // количество человек
  numPeople?: number; // альтернативное название для numberOfPeople в БД
  discount?: number; // скидка в процентах
  adminComment?: string;
  crossSellItems?: string[];
  paymentStatus: PaymentStatus;
  status?: string; // статус бронирования (pending, confirmed, cancelled)
  paymentId?: string;
  totalAmount: number;
  totalPrice?: number; // альтернативное название для totalAmount в БД
  originalAmount?: number; // сумма до скидки
  paidAmount: number;
  receiptUrl?: string; // ссылка на чек
  createdAt: string;
  updatedAt: string;
  editToken?: string; // токен для редактирования/отмены
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
    date: dbBooking.booking_date || dbBooking.date,
    startTime: dbBooking.start_time,
    endTime: dbBooking.end_time,
    roomId: dbBooking.room_id,
    name: dbBooking.customer_name || dbBooking.name,
    email: dbBooking.customer_email || dbBooking.email,
    phone: dbBooking.customer_phone || dbBooking.phone,
    comment: dbBooking.notes || dbBooking.comment,
    promoCode: dbBooking.promo_code,
    numberOfPeople: dbBooking.num_people || dbBooking.numberOfPeople,
    discount: dbBooking.discount,
    adminComment: dbBooking.admin_comment,
    paymentStatus: (dbBooking.payment_status as PaymentStatus) || 'UNPAID',
    paymentId: dbBooking.payment_id,
    totalAmount: dbBooking.total_price || dbBooking.totalAmount,
    originalAmount: dbBooking.original_amount,
    paidAmount: dbBooking.paid_amount || 0,
    receiptUrl: dbBooking.receipt_url,
    createdAt: dbBooking.created_at,
    updatedAt: dbBooking.updated_at || dbBooking.createdAt,
    editToken: dbBooking.edit_token || ''
  };
} 