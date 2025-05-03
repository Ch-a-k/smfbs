import { NextRequest, NextResponse } from 'next/server';
import { Booking } from '@/types/booking';
import { bookings } from '../bookings/data';

// Тип для клиента с историей бронирований
export interface Customer {
  name: string;
  email: string;
  phone: string;
  bookings: Booking[];
  totalBookings: number;
  totalSpent: number;
  firstBookingDate: string;
  lastBookingDate: string;
}

// Получить уникальных клиентов из бронирований
function getUniqueCustomers(): Map<string, Customer> {
  const customersMap = new Map<string, Customer>();
  
  // Группируем бронирования по email (в качестве уникального идентификатора клиента)
  bookings.forEach((booking: Booking) => {
    const email = booking.email.toLowerCase();
    
    if (!customersMap.has(email)) {
      customersMap.set(email, {
        name: booking.name,
        email: booking.email,
        phone: booking.phone,
        bookings: [],
        totalBookings: 0,
        totalSpent: 0,
        firstBookingDate: booking.date,
        lastBookingDate: booking.date
      });
    }
    
    const customer = customersMap.get(email)!;
    
    // Добавляем бронирование к истории клиента
    customer.bookings.push(booking);
    customer.totalBookings++;
    
    // Обновляем сумму потраченных средств
    if (booking.paymentStatus === 'FULLY_PAID') {
      customer.totalSpent += booking.totalAmount;
    } else if (booking.paymentStatus === 'DEPOSIT_PAID') {
      customer.totalSpent += booking.paidAmount;
    }
    
    // Обновляем даты первого и последнего бронирования
    if (booking.date < customer.firstBookingDate) {
      customer.firstBookingDate = booking.date;
    }
    if (booking.date > customer.lastBookingDate) {
      customer.lastBookingDate = booking.date;
    }
  });
  
  return customersMap;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const email = searchParams.get('email');
  const phone = searchParams.get('phone');
  const search = searchParams.get('search');
  
  const customersMap = getUniqueCustomers();
  let customers: Customer[] = Array.from(customersMap.values());
  
  // Фильтрация по email
  if (email) {
    const customer = customersMap.get(email.toLowerCase());
    return NextResponse.json(customer || null);
  }
  
  // Фильтрация по телефону
  if (phone) {
    customers = customers.filter(customer => customer.phone.includes(phone));
  }
  
  // Поиск по имени или email
  if (search) {
    const searchLower = search.toLowerCase();
    customers = customers.filter(customer => 
      customer.name.toLowerCase().includes(searchLower) || 
      customer.email.toLowerCase().includes(searchLower) ||
      customer.phone.includes(search)
    );
  }
  
  // Сортировка клиентов по количеству бронирований (по убыванию)
  customers.sort((a, b) => b.totalBookings - a.totalBookings);
  
  return NextResponse.json(customers);
} 