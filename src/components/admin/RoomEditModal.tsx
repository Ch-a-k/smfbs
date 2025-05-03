'use client';

import { useState, useEffect } from 'react';
import { Room, RoomSchedule } from '@/types/booking';
import RoomScheduleEditor from './RoomScheduleEditor';

interface RoomEditModalProps {
  room?: Room;
  onClose: () => void;
  onSave: (room: Partial<Room>) => Promise<void>;
}

export default function RoomEditModal({ room, onClose, onSave }: RoomEditModalProps) {
  const [name, setName] = useState('');
  const [capacity, setCapacity] = useState(4);
  const [maxPeople, setMaxPeople] = useState(4);
  const [isActive, setIsActive] = useState(true);
  const [schedule, setSchedule] = useState<RoomSchedule | undefined>(undefined);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'basic' | 'schedule'>('basic');
  
  // Загрузка данных комнаты при открытии модального окна
  useEffect(() => {
    if (room) {
      setName(room.name || '');
      setCapacity(room.capacity || 4);
      setMaxPeople(room.maxPeople || 4);
      setIsActive(room.isActive !== undefined ? room.isActive : true);
      setSchedule(room.workSchedule);
    }
  }, [room]);
  
  // Обработчик сохранения расписания
  const handleScheduleSave = async (roomId: number, newSchedule: RoomSchedule) => {
    setSchedule(newSchedule);
    
    // Если мы редактируем существующую комнату, сразу сохраняем расписание
    if (room && room.id) {
      await handleSave({ workSchedule: newSchedule });
    }
  };
  
  // Обработчик сохранения всей комнаты
  const handleSave = async (additionalData: Partial<Room> = {}) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const roomData: Partial<Room> = {
        ...additionalData,
        name,
        capacity,
        maxPeople,
        isActive
      };
      
      // Добавляем расписание, если оно было изменено
      if (schedule && !additionalData.workSchedule) {
        roomData.workSchedule = schedule;
      }
      
      // Добавляем ID комнаты, если она уже существует
      if (room && room.id) {
        roomData.id = room.id;
      }
      
      await onSave(roomData);
      onClose();
    } catch (err) {
      setError('Nie udało się zapisać pokoju. Spróbuj ponownie.');
      console.error('Error saving room:', err);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl max-w-3xl w-full max-h-[90vh] overflow-hidden shadow-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
          <h2 className="text-xl font-bold text-white">
            {room ? 'Edytuj pokój' : 'Dodaj nowy pokój'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Вкладки */}
        <div className="flex border-b border-gray-700">
          <button
            className={`px-4 py-3 font-medium ${activeTab === 'basic' ? 'text-[#f36e21] border-b-2 border-[#f36e21]' : 'text-gray-400'}`}
            onClick={() => setActiveTab('basic')}
          >
            Podstawowe informacje
          </button>
          <button
            className={`px-4 py-3 font-medium ${activeTab === 'schedule' ? 'text-[#f36e21] border-b-2 border-[#f36e21]' : 'text-gray-400'}`}
            onClick={() => setActiveTab('schedule')}
          >
            Harmonogram pracy
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-132px)]">
          {error && (
            <div className="mb-4 p-3 bg-red-900/50 border border-red-500 rounded-lg text-white">
              {error}
            </div>
          )}
          
          {activeTab === 'basic' && (
            <div className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">
                  Nazwa pokoju
                </label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg text-white px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#f36e21]"
                  placeholder="Wprowadź nazwę pokoju"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="capacity" className="block text-sm font-medium text-gray-300 mb-1">
                    Pojemność (osoby)
                  </label>
                  <input
                    type="number"
                    id="capacity"
                    value={capacity}
                    onChange={(e) => setCapacity(parseInt(e.target.value) || 0)}
                    min="1"
                    max="30"
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg text-white px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#f36e21]"
                  />
                </div>
                
                <div>
                  <label htmlFor="maxPeople" className="block text-sm font-medium text-gray-300 mb-1">
                    Maksymalna liczba osób
                  </label>
                  <input
                    type="number"
                    id="maxPeople"
                    value={maxPeople}
                    onChange={(e) => setMaxPeople(parseInt(e.target.value) || 0)}
                    min="1"
                    max="30"
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg text-white px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#f36e21]"
                  />
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4 text-[#f36e21] bg-gray-700 border-gray-600 rounded focus:ring-[#f36e21] focus:ring-opacity-25"
                />
                <label htmlFor="isActive" className="text-gray-300">
                  Pokój aktywny
                </label>
              </div>
            </div>
          )}
          
          {activeTab === 'schedule' && (
            <RoomScheduleEditor
              roomId={room?.id || 0}
              initialSchedule={schedule}
              onSave={handleScheduleSave}
            />
          )}
        </div>
        
        <div className="px-6 py-4 border-t border-gray-700 flex justify-end space-x-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-600 rounded-lg text-gray-300 hover:bg-gray-700 transition-colors"
          >
            Anuluj
          </button>
          
          {activeTab === 'basic' && (
            <button
              type="button"
              onClick={() => handleSave()}
              disabled={isLoading || !name}
              className="px-4 py-2 bg-[#f36e21] text-white rounded-lg hover:bg-[#e05e11] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Zapisywanie...' : 'Zapisz pokój'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
} 