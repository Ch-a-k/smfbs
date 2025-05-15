'use client';

import { Clock } from 'lucide-react';
import { addMinutes } from 'date-fns';
import { useI18n } from '@/i18n/I18nContext';
import { Loader2 } from 'lucide-react';

interface TimeSelectorProps {
  selectedTime: string | null;
  onChange: (time: string) => void;
  date: Date;
  durationMinutes: number;
  availableTimes: string[];
  isLoading: boolean;
}

interface TimeSlot {
  startTime: string;
  endTime: string;
}

export default function TimeSelector({
  selectedTime,
  onChange,
  date,
  durationMinutes,
  availableTimes,
  isLoading,
}: TimeSelectorProps) {
  const { t } = useI18n();

  const handleTimeSelect = (time: string) => {
    onChange(time);
  };

  // Function to create time slots from available times
  const createTimeSlots = (): TimeSlot[] => {
    return availableTimes.map((startTime) => {
      const [hours, minutes] = startTime.split(':').map(Number);
      const startDate = new Date(date);
      startDate.setHours(hours, minutes, 0, 0);
      
      const endDate = addMinutes(startDate, durationMinutes);
      const endTime = `${endDate.getHours().toString().padStart(2, '0')}:${endDate.getMinutes().toString().padStart(2, '0')}`;
      
      return {
        startTime,
        endTime,
      };
    });
  };

  const timeSlots = createTimeSlots();

  return (
    <div className="w-full">
      <div className="flex items-center gap-2 mb-3">
        <Clock className="h-4 w-4 text-[#f36e21]" />
        <h3 className="text-sm font-medium text-white">{t('booking.time.selectTime')}</h3>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-[#f36e21]" />
        </div>
      ) : timeSlots.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {timeSlots.map((slot, index) => (
            <button
              key={`${slot.startTime}-${index}`}
              type="button"
              onClick={() => handleTimeSelect(slot.startTime)}
              className={`
                py-3 px-3 rounded-lg text-sm font-medium transition-all duration-200
                ${selectedTime === slot.startTime
                  ? 'bg-[#f36e21] text-white shadow-lg shadow-[#f36e21]/20'
                  : 'bg-black/40 hover:bg-black/60 text-white border border-white/10 hover:border-white/20'
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
      
      {/* Duration information */}
      <div className="mt-4 text-xs text-gray-400">
        <div className="flex items-center">
          <Clock className="w-3 h-3 mr-1 text-gray-500" />
          {t('booking.time.durationInfo')}: {durationMinutes} {t('booking.time.minutes')}
        </div>
      </div>
    </div>
  );
}