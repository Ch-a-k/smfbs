'use client';

import React, { useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format, addDays } from 'date-fns';
import { ru } from 'date-fns/locale';

// Моковые данные бронирований
const mockBookings = [
  {
    id: '1',
    customerName: 'Иван Петров',
    packageName: 'ŚREDNI',
    date: new Date(2023, 6, 15, 14, 0),
    duration: 120,
    room: 'Комната 1',
    status: 'paid'
  },
  {
    id: '2',
    customerName: 'Анна Смирнова',
    packageName: 'TRUDNY',
    date: new Date(2023, 6, 15, 17, 0),
    duration: 180,
    room: 'Комната 2',
    status: 'deposit'
  },
  {
    id: '3',
    customerName: 'Петр Сидоров',
    packageName: 'ŁATWY',
    date: new Date(2023, 6, 16, 10, 0),
    duration: 45,
    room: 'Комната 1',
    status: 'unpaid'
  },
  {
    id: '4',
    customerName: 'Мария Иванова',
    packageName: 'BUŁKA Z MASŁEM',
    date: new Date(2023, 6, 17, 12, 0),
    duration: 30,
    room: 'Комната 3',
    status: 'paid'
  },
  {
    id: '5',
    customerName: 'Алексей Кузнецов',
    packageName: 'ŚREDNI',
    date: addDays(new Date(), 1),
    duration: 120,
    room: 'Комната 2',
    status: 'paid'
  },
  {
    id: '6',
    customerName: 'Ольга Новикова',
    packageName: 'TRUDNY',
    date: addDays(new Date(), 2),
    duration: 180,
    room: 'Комната 1',
    status: 'deposit'
  },
  {
    id: '7',
    customerName: 'Дмитрий Смирнов',
    packageName: 'ŁATWY',
    date: new Date(),
    duration: 45,
    room: 'Комната 3',
    status: 'unpaid'
  }
];

// Функция для получения статуса оплаты
const getStatusBadge = (status: string) => {
  switch (status) {
    case 'paid':
      return <Badge className="bg-green-500 hover:bg-green-600">Оплачено</Badge>;
    case 'deposit':
      return <Badge className="bg-yellow-500 hover:bg-yellow-600">Задаток</Badge>;
    case 'unpaid':
      return <Badge className="bg-red-500 hover:bg-red-600">Не оплачено</Badge>;
    default:
      return null;
  }
};

export default function BookingCalendar() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  
  // Фильтруем бронирования по выбранной дате
  const bookingsForSelectedDate = selectedDate 
    ? mockBookings.filter(booking => 
        booking.date.getDate() === selectedDate.getDate() && 
        booking.date.getMonth() === selectedDate.getMonth() &&
        booking.date.getFullYear() === selectedDate.getFullYear()
      )
    : [];

  // Сортируем бронирования по времени
  const sortedBookings = [...bookingsForSelectedDate].sort((a, b) => 
    a.date.getTime() - b.date.getTime()
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 bg-gray-800 p-4 rounded-lg shadow">
          <h3 className="text-lg font-medium text-white mb-4">Выберите дату</h3>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            className="bg-gray-800 text-white rounded-md border border-gray-700"
          />
        </div>
        
        <div className="md:col-span-2 space-y-4">
          <h3 className="text-lg font-medium text-white">
            Бронирования на {selectedDate ? format(selectedDate, 'd MMMM yyyy', { locale: ru }) : 'выбранную дату'}
          </h3>
          
          {sortedBookings.length === 0 ? (
            <div className="bg-gray-800 p-6 rounded-lg text-center">
              <p className="text-gray-400">Нет бронирований на выбранную дату</p>
            </div>
          ) : (
            <div className="space-y-4">
              {sortedBookings.map(booking => (
                <Card key={booking.id} className="bg-gray-800 border border-gray-700 hover:border-gray-600 transition-all">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg font-bold text-white">
                        {format(booking.date, 'HH:mm')} - {booking.customerName}
                      </CardTitle>
                      {getStatusBadge(booking.status)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-gray-400">Пакет:</span> 
                        <span className="text-white ml-1 font-medium">{booking.packageName}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Комната:</span> 
                        <span className="text-white ml-1 font-medium">{booking.room}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Длительность:</span> 
                        <span className="text-white ml-1 font-medium">{booking.duration} мин</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Окончание:</span> 
                        <span className="text-white ml-1 font-medium">
                          {format(new Date(booking.date.getTime() + booking.duration * 60000), 'HH:mm')}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}