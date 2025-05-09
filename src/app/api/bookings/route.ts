import { NextResponse } from 'next/server';

// Временное хранилище для бронирований (в реальном приложении здесь будет база данных)
let bookings = [
  {
    id: '1',
    customerName: 'Jan Kowalski',
    email: 'jan@example.com',
    phone: '+48123456789',
    packageName: 'ŚREDNI',
    date: new Date(2024, 2, 20, 14, 0),
    duration: 120,
    room: 'Комната 1',
    status: 'paid'
  },
  {
    id: '2',
    customerName: 'Anna Nowak',
    email: 'anna@example.com',
    phone: '+48987654321',
    packageName: 'TRUDNY',
    date: new Date(2024, 2, 20, 17, 0),
    duration: 180,
    room: 'Комната 2',
    status: 'deposit'
  }
];

export async function GET() {
  return NextResponse.json(bookings);
}

export async function POST(request: Request) {
  const booking = await request.json();
  
  // Генерируем уникальный ID
  booking.id = Math.random().toString(36).substr(2, 9);
  
  // Преобразуем строку даты в объект Date
  booking.date = new Date(booking.date);
  
  // Добавляем бронирование в массив
  bookings.push(booking);
  
  return NextResponse.json(booking, { status: 201 });
}

export async function DELETE(request: Request) {
  const { id } = await request.json();
  
  // Удаляем бронирование из массива
  bookings = bookings.filter(booking => booking.id !== id);
  
  return NextResponse.json({ success: true });
}