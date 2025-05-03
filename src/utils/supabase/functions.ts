import { RoomSchedule, DaySchedule } from '@/types/booking';
import { Json } from '@/types/database.types';

/**
 * Функция для создания структуры расписания по умолчанию
 * @returns Стандартное расписание работы для всех дней недели
 */
export function getDefaultWorkSchedule(): RoomSchedule {
  return {
    monday: { isActive: true, startTime: '09:00', endTime: '22:00' },
    tuesday: { isActive: true, startTime: '09:00', endTime: '22:00' },
    wednesday: { isActive: true, startTime: '09:00', endTime: '22:00' },
    thursday: { isActive: true, startTime: '09:00', endTime: '22:00' },
    friday: { isActive: true, startTime: '09:00', endTime: '22:00' },
    saturday: { isActive: true, startTime: '10:00', endTime: '22:00' },
    sunday: { isActive: true, startTime: '10:00', endTime: '20:00' }
  };
}

/**
 * Функция для создания структуры расписания по умолчанию в формате JSONB для Supabase
 * @returns Стандартное расписание работы для всех дней недели в формате JSON
 */
export function getDefaultWorkScheduleJson(): Json {
  return {
    monday: { isActive: true, startTime: '09:00', endTime: '22:00' },
    tuesday: { isActive: true, startTime: '09:00', endTime: '22:00' },
    wednesday: { isActive: true, startTime: '09:00', endTime: '22:00' },
    thursday: { isActive: true, startTime: '09:00', endTime: '22:00' },
    friday: { isActive: true, startTime: '09:00', endTime: '22:00' },
    saturday: { isActive: true, startTime: '10:00', endTime: '22:00' },
    sunday: { isActive: true, startTime: '10:00', endTime: '20:00' }
  };
}

/**
 * Функция для нормализации расписания комнаты
 * Исправляет несоответствия в структуре расписания и обеспечивает валидные значения
 * @param workSchedule Текущее расписание, может быть неполным или некорректным
 * @returns Нормализованное расписание
 */
export function normalizeRoomSchedule(workSchedule: any): RoomSchedule {
  const defaultSchedule = getDefaultWorkSchedule();
  
  if (!workSchedule) {
    return defaultSchedule;
  }
  
  // Проверяем и нормализуем каждый день недели
  const days: (keyof RoomSchedule)[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const normalizedSchedule: RoomSchedule = {} as RoomSchedule;
  
  for (const day of days) {
    // Получаем текущее расписание для дня или используем значение по умолчанию
    const daySchedule = workSchedule[day] || defaultSchedule[day];
    
    // Нормализуем поле isActive, учитывая возможное использование active вместо isActive
    let isActive = daySchedule.isActive;
    if (isActive === undefined && (daySchedule as any).active !== undefined) {
      isActive = (daySchedule as any).active;
    }
    
    // Создаем нормализованное расписание для дня
    normalizedSchedule[day] = {
      isActive: isActive !== undefined ? isActive : true,
      startTime: daySchedule.startTime || defaultSchedule[day].startTime,
      endTime: daySchedule.endTime || defaultSchedule[day].endTime
    };
  }
  
  return normalizedSchedule;
} 