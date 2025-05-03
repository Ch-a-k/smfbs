'use client';

import { useState, useEffect } from 'react';
import { RoomSchedule, DaySchedule } from '@/types/booking';
import { getDefaultWorkSchedule } from '@/utils/supabase/functions';

interface RoomScheduleEditorProps {
  roomId: number;
  initialSchedule?: RoomSchedule;
  onSave: (roomId: number, schedule: RoomSchedule) => Promise<void>;
}

const daysOfWeek = [
  { key: 'monday', label: 'Poniedziałek' },
  { key: 'tuesday', label: 'Wtorek' },
  { key: 'wednesday', label: 'Środa' },
  { key: 'thursday', label: 'Czwartek' },
  { key: 'friday', label: 'Piątek' },
  { key: 'saturday', label: 'Sobota' },
  { key: 'sunday', label: 'Niedziela' }
] as const;

// Этот объект больше не используется, так как мы теперь используем getDefaultWorkSchedule
// Но оставляем его для совместимости, если кто-то на него ссылается
const defaultDaySchedule: DaySchedule = {
  isActive: true,
  startTime: '10:00',
  endTime: '20:00'
};

export default function RoomScheduleEditor({ roomId, initialSchedule, onSave }: RoomScheduleEditorProps) {
  // Инициализация расписания с использованием функции getDefaultWorkSchedule
  const [schedule, setSchedule] = useState<RoomSchedule>(getDefaultWorkSchedule());
  
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Загрузка начального расписания
  useEffect(() => {
    if (initialSchedule) {
      const fullSchedule = { ...schedule };
      
      // Обрабатываем каждый день недели
      daysOfWeek.forEach(({ key }) => {
        if (initialSchedule[key]) {
          fullSchedule[key] = initialSchedule[key];
        }
      });
      
      setSchedule(fullSchedule);
    }
  }, [initialSchedule]);
  
  // Обновление статуса дня (активен/неактивен)
  const handleDayActiveChange = (day: keyof RoomSchedule, isActive: boolean) => {
    setSchedule(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        isActive
      }
    }));
  };
  
  // Обновление времени начала работы
  const handleStartTimeChange = (day: keyof RoomSchedule, startTime: string) => {
    setSchedule(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        startTime
      }
    }));
  };
  
  // Обновление времени окончания работы
  const handleEndTimeChange = (day: keyof RoomSchedule, endTime: string) => {
    setSchedule(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        endTime
      }
    }));
  };
  
  // Копирование расписания для всех дней
  const handleCopyToAllDays = (sourceDay: keyof RoomSchedule) => {
    const sourceDaySchedule = schedule[sourceDay];
    if (!sourceDaySchedule) return;
    
    const newSchedule = { ...schedule };
    daysOfWeek.forEach(({ key }) => {
      if (key !== sourceDay) {
        newSchedule[key] = { ...sourceDaySchedule };
      }
    });
    
    setSchedule(newSchedule);
  };
  
  // Сохранение расписания
  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    
    try {
      await onSave(roomId, schedule);
    } catch (err) {
      setError('Nie udało się zapisać harmonogramu. Spróbuj ponownie.');
      console.error('Error saving schedule:', err);
    } finally {
      setIsSaving(false);
    }
  };
  
  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <h3 className="text-xl font-semibold text-white mb-4">Harmonogram pracy pokoju</h3>
      
      {error && (
        <div className="mb-4 p-3 bg-red-900/50 border border-red-500 rounded-lg text-white">
          {error}
        </div>
      )}
      
      <div className="space-y-4">
        {daysOfWeek.map(({ key, label }) => (
          <div key={key} className="p-4 bg-gray-700 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id={`active-${key}`}
                  checked={schedule[key]?.isActive ?? false}
                  onChange={(e) => handleDayActiveChange(key, e.target.checked)}
                  className="w-4 h-4 text-[#f36e21] bg-gray-600 border-gray-500 rounded focus:ring-[#f36e21] focus:ring-opacity-25"
                />
                <label htmlFor={`active-${key}`} className="ml-2 text-white font-medium">
                  {label}
                </label>
              </div>
              
              <button
                type="button"
                onClick={() => handleCopyToAllDays(key)}
                className="text-sm text-gray-300 hover:text-[#f36e21] transition-colors"
              >
                Kopiuj do wszystkich dni
              </button>
            </div>
            
            <div className={`grid grid-cols-2 gap-4 ${!schedule[key]?.isActive ? 'opacity-50' : ''}`}>
              <div>
                <label htmlFor={`start-${key}`} className="block text-sm text-gray-400 mb-1">
                  Godzina otwarcia
                </label>
                <input
                  type="time"
                  id={`start-${key}`}
                  value={schedule[key]?.startTime || '10:00'}
                  onChange={(e) => handleStartTimeChange(key, e.target.value)}
                  disabled={!schedule[key]?.isActive}
                  className="w-full bg-gray-600 border border-gray-500 rounded-lg text-white px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#f36e21]"
                />
              </div>
              <div>
                <label htmlFor={`end-${key}`} className="block text-sm text-gray-400 mb-1">
                  Godzina zamknięcia
                </label>
                <input
                  type="time"
                  id={`end-${key}`}
                  value={schedule[key]?.endTime || '20:00'}
                  onChange={(e) => handleEndTimeChange(key, e.target.value)}
                  disabled={!schedule[key]?.isActive}
                  className="w-full bg-gray-600 border border-gray-500 rounded-lg text-white px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#f36e21]"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-6 flex justify-end">
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="bg-[#f36e21] text-white px-4 py-2 rounded-lg hover:bg-[#e05e11] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? 'Zapisywanie...' : 'Zapisz harmonogram'}
        </button>
      </div>
    </div>
  );
} 