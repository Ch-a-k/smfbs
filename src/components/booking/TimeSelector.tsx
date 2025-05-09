'use client';

import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { format, addMinutes } from 'date-fns';
import { pl, enUS } from 'date-fns/locale';
import { useI18n } from '@/i18n/I18nContext';

interface TimeSelectorProps {
  selectedTime: string | null;
  onChange: (time: string) => void;
  date: Date;
  durationMinutes: number;
}

interface TimeSlot {
  id: string;
  startTime: string;
  endTime: string; // Добавляем endTime для отображения интервала
  isAvailable: boolean;
}

export default function TimeSelector({ selectedTime, onChange, date, durationMinutes }: TimeSelectorProps) {
  const { t, locale } = useI18n();
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Генерация временных слотов при изменении даты
    if (!date) return;

    setIsLoading(true);
    
    try {
      // Генерируем фиктивные слоты для демонстрации
      // В реальном приложении заменить на вызов API или getAvailableTimeSlots
      const generatedSlots = generateTimeSlots(date, durationMinutes);
      setTimeSlots(generatedSlots);
    } catch (error) {
      console.error('Ошибка при получении доступных временных слотов:', error);
      setTimeSlots([]);
    } finally {
      setIsLoading(false);
    }
  }, [date, durationMinutes]);

  // Функция для генерации временных слотов
  const generateTimeSlots = (selectedDate: Date, duration: number): TimeSlot[] => {
    const slots: TimeSlot[] = [];
    const dayOfWeek = selectedDate.getDay(); // 0 - воскресенье, 6 - суббота
    
    // На выходных работаем с 10:00 до 22:00
    // В будние дни с 10:00 до 20:00
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const startHour = 10; // Начало работы
    const endHour = isWeekend ? 22 : 20; // Конец работы
    
    // Генерируем слоты с 30-минутным интервалом
    // Учитываем, что последний слот должен закончиться до времени закрытия
    for (let hour = startHour; hour < endHour; hour++) {
      for (let minutes of [0, 30]) {
        // Создаем временную метку для старта слота
        const startDate = new Date(selectedDate);
        startDate.setHours(hour, minutes, 0, 0);
        
        // Создаем временную метку для конца слота (с учетом длительности пакета)
        const endDate = addMinutes(startDate, duration);
        
        // Проверяем, не выходит ли слот за пределы рабочего времени
        if (endDate.getHours() > endHour || 
           (endDate.getHours() === endHour && endDate.getMinutes() > 0)) {
          continue;
        }
        
        // Форматируем время
        const startTimeStr = `${hour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
        const endTimeStr = `${endDate.getHours().toString().padStart(2, '0')}:${endDate.getMinutes().toString().padStart(2, '0')}`;
        
        // Случайно делаем некоторые слоты недоступными (для демонстрации)
        // В реальном приложении заменить на проверку с API
        const isAvailable = Math.random() > 0.3; // 70% слотов доступны
        
        slots.push({
          id: `time-${hour}-${minutes}`,
          startTime: startTimeStr,
          endTime: endTimeStr,
          isAvailable
        });
      }
    }
    
    return slots;
  };

  const handleTimeSelect = (time: string) => {
    onChange(time);
  };

  return (
    <div className="w-full">
      <div className="flex items-center gap-2 mb-3">
        <Clock className="h-4 w-4 text-[#f36e21]" />
        <h3 className="text-sm font-medium text-white">{t('booking.time.selectTime')}</h3>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#f36e21]"></div>
        </div>
      ) : timeSlots.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {timeSlots.map((slot) => (
            <button
              key={slot.id}
              type="button"
              disabled={!slot.isAvailable}
              onClick={() => handleTimeSelect(slot.startTime)}
              className={`
                py-3 px-3 rounded-lg text-sm font-medium transition-all duration-200
                ${selectedTime === slot.startTime
                  ? 'bg-[#f36e21] text-white shadow-lg shadow-[#f36e21]/20'
                  : slot.isAvailable
                  ? 'bg-black/40 hover:bg-black/60 text-white border border-white/10 hover:border-white/20'
                  : 'bg-black/20 text-gray-500 cursor-not-allowed border border-white/5'
                }
              `}
            >
              <div className="flex flex-col items-center">
                <span className={selectedTime === slot.startTime ? 'text-white' : 'text-gray-300'}>
                  {slot.startTime}
                </span>
                <span className={`text-xs mt-1 ${selectedTime === slot.startTime ? 'text-white/90' : 'text-gray-400'}`}>
                  {t('booking.time.to')} {slot.endTime}
                </span>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 bg-black/20 rounded-lg border border-white/5">
          <div className="text-gray-400">
            {t('booking.time.noAvailableSlots')}
          </div>
        </div>
      )}
      
      {/* Информация о длительности */}
      <div className="mt-4 text-xs text-gray-400">
        <div className="flex items-center">
          <Clock className="w-3 h-3 mr-1 text-gray-500" />
          {t('booking.time.durationInfo')}: {durationMinutes} {t('booking.time.minutes')}
        </div>
      </div>
    </div>
  );
} 