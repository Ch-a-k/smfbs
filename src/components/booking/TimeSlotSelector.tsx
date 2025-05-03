'use client';

import { useState, useEffect } from 'react';
import { TimeSlot } from '@/types/booking';

interface TimeSlotSelectorProps {
  date: string;
  packageId: string;
  packageDuration: number;
  onTimeSlotSelect: (timeSlot: TimeSlot) => void;
}

export function TimeSlotSelector({ date, packageId, packageDuration, onTimeSlotSelect }: TimeSlotSelectorProps) {
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Запрос к API для получения доступных слотов с учетом расписания комнат
  useEffect(() => {
    const fetchTimeSlots = async () => {
      if (!date || !packageId) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        console.log(`Запрос временных слотов: date=${date}, packageId=${packageId}`);
        const response = await fetch(`/api/bookings/availability?date=${date}&packageId=${packageId}&type=slots`);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Ошибка при получении временных слотов: ${response.status}`, errorText);
          throw new Error(`Ошибка при получении временных слотов: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Получены временные слоты:', data);
        
        // Проверка формата данных
        if (!Array.isArray(data)) {
          console.error('Неверный формат данных, ожидался массив:', data);
          throw new Error('Неверный формат данных, получен не массив');
        }
        
        // Проверка полей в каждом слоте
        const isValidSlot = (slot: any) => 
          slot && 
          typeof slot.id === 'string' && 
          typeof slot.startTime === 'string' && 
          typeof slot.endTime === 'string' && 
          typeof slot.available === 'boolean' && 
          Array.isArray(slot.availableRooms);
        
        if (data.length > 0 && !isValidSlot(data[0])) {
          console.error('Неверный формат временного слота:', data[0]);
          throw new Error('Неверный формат временных слотов');
        }
        
        setTimeSlots(data);
      } catch (err: any) {
        console.error('Ошибка загрузки временных слотов:', err);
        setError(`Не удалось загрузить доступные временные слоты: ${err.message || 'Неизвестная ошибка'}`);
        setTimeSlots([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchTimeSlots();
  }, [date, packageId]);
  
  // Обработчик выбора временного слота
  const handleSlotSelect = (slot: TimeSlot) => {
    if (!slot.available) return;
    
    setSelectedSlot(slot.id);
    onTimeSlotSelect(slot);
  };
  
  if (isLoading) {
    return (
      <div className="bg-[#231f20] rounded-lg p-4 shadow-md flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#f36e21]"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-[#231f20] rounded-lg p-4 shadow-md h-64 flex flex-col justify-center items-center">
        <svg className="w-12 h-12 text-red-500/70 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <p className="text-white/70 text-center">{error}</p>
      </div>
    );
  }
  
  if (timeSlots.length === 0) {
    return (
      <div className="bg-[#231f20] rounded-lg p-4 shadow-md h-64 flex flex-col justify-center items-center">
        <svg className="w-12 h-12 text-white/50 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-white/70 text-center mb-2">Brak dostępnych terminów. Wybierz inną datę.</p>
        <p className="text-white/70 text-center text-sm">Нет доступных слотов. Выберите другую дату или пакет.</p>
      </div>
    );
  }
  
  return (
    <div className="bg-[#231f20] rounded-lg p-4 shadow-md">
      <div className="grid grid-cols-1 gap-2">
        {timeSlots.map(slot => (
          <div
            key={slot.id}
            onClick={() => handleSlotSelect(slot)}
            className={`
              p-3 rounded-md border border-white/10 flex justify-between items-center
              ${slot.available 
                ? 'cursor-pointer hover:border-[#f36e21] transition-colors' 
                : 'opacity-50 cursor-not-allowed'}
              ${selectedSlot === slot.id ? 'bg-[#f36e21] border-[#f36e21]' : ''}
            `}
          >
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-white font-medium">{slot.startTime} - {slot.endTime}</span>
            </div>
            
            <div className="flex items-center">
              <div className="text-xs px-2 py-1 rounded-full bg-white/10 text-white/70 mr-2">
                {packageDuration} min
              </div>
              {slot.availableRooms && (
                <div className="text-xs px-2 py-1 rounded-full bg-green-800/30 text-green-400/90">
                  {slot.availableRooms.length} {slot.availableRooms.length === 1 ? 'pokój' : 'pokoje'}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 