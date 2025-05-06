'use client';

import { useState, useEffect } from 'react';
import { useI18n } from '@/i18n/I18nContext';
import { Clock } from 'lucide-react';

interface TimeSelectorProps {
  selectedTime: string | null;
  onChange: (time: string) => void;
  date: Date | null;
  durationMinutes: number;
}

interface TimeSlot {
  id: string;
  time: string;
  formattedTime: string;
  isAvailable: boolean;
}

export default function TimeSelector({ selectedTime, onChange, date, durationMinutes }: TimeSelectorProps) {
  const { t, locale } = useI18n();
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Effect for generating time slots when selected date changes
  useEffect(() => {
    if (!date) return;
    
    // In a real application, there should be an API request here to get available slots
    // for the selected date, considering occupancy and working hours
    setIsLoading(true);
    
    // Simulating data loading from the server
    setTimeout(() => {
      const slots = generateTimeSlots();
      setTimeSlots(slots);
      setIsLoading(false);
    }, 500);
  }, [date]);
  
  // Function to generate time slots (stub)
  const generateTimeSlots = () => {
    const slots: TimeSlot[] = [];
    
    // Start of work day - 9:00, end - 22:00
    // Interval between slots - 30 minutes
    const startHour = 9;
    const endHour = 22;
    const interval = 30; // minutes
    
    // Example of random unavailability of slots
    const randomUnavailable = new Set<string>();
    for (let i = 0; i < 5; i++) {
      const hour = Math.floor(Math.random() * (endHour - startHour)) + startHour;
      const minute = Math.random() > 0.5 ? 30 : 0;
      randomUnavailable.add(`${hour}:${minute === 0 ? '00' : '30'}`);
    }
    
    // Generating slots
    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += interval) {
        const timeString = `${hour}:${minute === 0 ? '00' : minute}`;
        const isAvailable = !randomUnavailable.has(timeString);
        
        // Formatted time for display
        const hourFormatted = hour.toString().padStart(2, '0');
        const minuteFormatted = minute.toString().padStart(2, '0');
        const formattedTime = `${hourFormatted}:${minuteFormatted}`;
        
        slots.push({
          id: `time-${hour}-${minute}`,
          time: formattedTime,
          formattedTime: formattedTime,
          isAvailable
        });
      }
    }
    
    return slots;
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#f36e21]"></div>
        <span className="ml-2 text-gray-300">{t('booking.date.loading')}</span>
      </div>
    );
  }
  
  if (!date) {
    return (
      <div className="text-center py-6 text-gray-400">
        {t('booking.date.selectDate')}
      </div>
    );
  }
  
  if (timeSlots.length === 0) {
    return (
      <div className="text-center py-6 text-gray-400">
        {t('booking.date.noTimeSlots')}
      </div>
    );
  }
  
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-gray-300 mb-2">
        <Clock className="h-5 w-5 text-[#f36e21]" />
        <span className="font-medium">{t('booking.date.selectTime')}</span>
      </div>
      
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
        {timeSlots.map(slot => (
          <button
            key={slot.id}
            onClick={() => slot.isAvailable && onChange(slot.time)}
            disabled={!slot.isAvailable}
            className={`
              py-2 px-3 rounded-md text-center transition-colors
              ${selectedTime === slot.time 
                ? 'bg-[#f36e21] text-white' 
                : slot.isAvailable 
                  ? 'bg-black/40 text-white hover:bg-black/60 border border-white/10' 
                  : 'bg-black/20 text-gray-500 cursor-not-allowed border border-white/5'
              }
            `}
          >
            {slot.formattedTime}
          </button>
        ))}
      </div>
      
      <div className="text-xs text-gray-400 mt-2">
        {t('booking.date.durationLabel')} {durationMinutes} {t('common.minutes')}
      </div>
    </div>
  );
} 