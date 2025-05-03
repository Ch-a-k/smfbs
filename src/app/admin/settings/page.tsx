'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Package, Room } from '@/types/booking';
import RoomEditModal from '@/components/admin/RoomEditModal';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  PlusIcon, 
  Tag
} from 'lucide-react';
import { DataTable } from '@/components/ui/data-table';
import { useToast } from '@/components/ui/use-toast';
import { getDefaultWorkSchedule } from '@/utils/supabase/functions';

// Определение колонок для таблицы комнат
const roomColumns = [
  { accessorKey: 'name', header: 'Название' },
  { accessorKey: 'capacity', header: 'Вместимость' },
  { accessorKey: 'maxPeople', header: 'Макс. людей' },
  { accessorKey: 'isActive', header: 'Активна', 
    cell: ({ row }: { row: any }) => (
      <span>{row.original.isActive ? 'Да' : 'Нет'}</span>
    )
  },
  { accessorKey: 'actions', header: 'Действия',
    cell: ({ row, table }: { row: any, table: any }) => (
      <div className="flex space-x-2">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => table.options.meta?.onEdit(row.original)}
        >
          Изменить
        </Button>
        <Button 
          variant="destructive" 
          size="sm" 
          onClick={() => table.options.meta?.onDelete(row.original.id)}
        >
          Удалить
        </Button>
      </div>
    )
  }
];

// Определение колонок для таблицы пакетов
const packageColumns = [
  { accessorKey: 'name', header: 'Название' },
  { accessorKey: 'price', header: 'Цена' },
  { accessorKey: 'actions', header: 'Действия',
    cell: ({ row, table }: { row: any, table: any }) => (
      <div className="flex space-x-2">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => table.options.meta?.onEdit(row.original)}
        >
          Изменить
        </Button>
        <Button 
          variant="destructive" 
          size="sm" 
          onClick={() => table.options.meta?.onDelete(row.original.id)}
        >
          Удалить
        </Button>
      </div>
    )
  }
];

// Определение колонок для таблицы промокодов
const promocodeColumns = [
  { accessorKey: 'code', header: 'Код' },
  { accessorKey: 'discount', header: 'Скидка %' },
  { accessorKey: 'actions', header: 'Действия',
    cell: ({ row, table }: { row: any, table: any }) => (
      <div className="flex space-x-2">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => table.options.meta?.onEdit(row.original)}
        >
          Изменить
        </Button>
        <Button 
          variant="destructive" 
          size="sm" 
          onClick={() => table.options.meta?.onDelete(row.original.id)}
        >
          Удалить
        </Button>
      </div>
    )
  }
];

export default function AdminSettings() {
  const [activeTab, setActiveTab] = useState<'packages' | 'rooms' | 'promocodes'>('packages');
  const [packages, setPackages] = useState<Package[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [promocodes, setPromocodes] = useState<{code: string, discount: number, validUntil: string}[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Состояние для модального окна редактирования комнаты
  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | undefined>(undefined);
  
  // Состояния для пакетов и промокодов (заглушки)
  const [isPackageModalOpen, setIsPackageModalOpen] = useState(false);
  const [isPromocodeModalOpen, setIsPromocodeModalOpen] = useState(false);

  // Toast для уведомлений
  const { toast } = useToast();
  
  // Функция для загрузки данных
  const fetchData = async () => {
    setLoading(true);
    try {
      // Загружаем пакеты
      const packagesRes = await fetch('/api/packages');
      const packagesData = await packagesRes.json();
      setPackages(packagesData);
      
      // Загружаем комнаты
      const roomsRes = await fetch('/api/rooms');
      const roomsData = await roomsRes.json();
      setRooms(roomsData);
      
      // Загружаем промо-коды (заглушка пока нет API)
      setPromocodes([
        { code: 'SUMMER2023', discount: 15, validUntil: '2023-08-31' },
        { code: 'WELCOME10', discount: 10, validUntil: '2023-12-31' }
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Ошибка загрузки данных',
        description: 'Не удалось загрузить необходимые данные',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchData();
  }, []);
  
  // Открытие модального окна для редактирования комнаты
  const handleEditRoom = (room: Room) => {
    setSelectedRoom(room);
    setIsRoomModalOpen(true);
  };
  
  // Открытие модального окна для создания новой комнаты
  const handleAddRoom = () => {
    setSelectedRoom(undefined);
    setIsRoomModalOpen(true);
  };
  
  // Сохранение комнаты
  const handleSaveRoom = async (roomData: Partial<Room>) => {
    try {
      let response;
      
      if (roomData.id) {
        // Обновление существующей комнаты
        response = await fetch('/api/rooms', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(roomData),
        });
      } else {
        // Создание новой комнаты
        response = await fetch('/api/rooms', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(roomData),
        });
      }
      
      if (!response.ok) {
        throw new Error('Failed to save room');
      }
      
      // Обновляем список комнат
      fetchData();
      
      toast({
        title: 'Успешно',
        description: `Комната ${roomData.id ? 'обновлена' : 'создана'}`,
      });
      
      setIsRoomModalOpen(false);
    } catch (error) {
      console.error('Error saving room:', error);
      toast({
        title: 'Ошибка',
        description: `Не удалось ${roomData.id ? 'обновить' : 'создать'} комнату`,
        variant: 'destructive',
      });
    }
  };
  
  // Удаление комнаты
  const handleDeleteRoom = async (roomId: number) => {
    if (!confirm('Czy na pewno chcesz usunąć ten pokój?')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/rooms?id=${roomId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete room');
      }
      
      // Обновляем список комнат
      fetchData();
      
      toast({
        title: 'Успешно',
        description: 'Комната удалена',
      });
    } catch (error) {
      console.error('Error deleting room:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось удалить комнату',
        variant: 'destructive',
      });
    }
  };
  
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Ustawienia</h1>
          <p className="text-gray-400 mt-1">Zarządzaj pakietami, pokojami i kodami promocyjnymi</p>
        </div>
        <Link 
          href="/admin" 
          className="flex items-center text-gray-400 hover:text-[#f36e21] transition-colors"
        >
          <svg 
            className="w-5 h-5 mr-1" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M10 19l-7-7m0 0l7-7m-7 7h18" 
            />
          </svg>
          Wróć do panelu
        </Link>
      </div>
      
      {/* Вкладки */}
      <div className="mb-6 border-b border-gray-700">
        <div className="flex space-x-8">
          <button
            onClick={() => setActiveTab('packages')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'packages' 
                ? 'border-[#f36e21] text-[#f36e21]' 
                : 'border-transparent text-gray-400 hover:text-gray-300'
            }`}
          >
            Pakiety
          </button>
          
          <button
            onClick={() => setActiveTab('rooms')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'rooms' 
                ? 'border-[#f36e21] text-[#f36e21]' 
                : 'border-transparent text-gray-400 hover:text-gray-300'
            }`}
          >
            Pokoje
          </button>
          
          <button
            onClick={() => setActiveTab('promocodes')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'promocodes' 
                ? 'border-[#f36e21] text-[#f36e21]' 
                : 'border-transparent text-gray-400 hover:text-gray-300'
            }`}
          >
            Kody promocyjne
          </button>
        </div>
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#f36e21]"></div>
        </div>
      ) : (
        <>
          {/* Содержимое вкладки "Пакеты" */}
          {activeTab === 'packages' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-white">Lista pakietów</h2>
                <button className="bg-[#f36e21] text-white px-4 py-2 rounded-lg hover:bg-[#e05e11] transition-colors">
                  Dodaj nowy pakiet
                </button>
              </div>
              
              <div className="bg-gray-800 rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-700">
                  <thead className="bg-gray-700">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Nazwa
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Czas trwania (min)
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Cena
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Akcje
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-gray-800 divide-y divide-gray-700">
                    {packages.map((pkg) => (
                      <tr key={pkg.id} className="hover:bg-gray-750">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                          {pkg.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                          {pkg.duration}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                          {pkg.price} zł
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                          <button className="text-blue-400 hover:text-blue-300 mr-3">
                            Edytuj
                          </button>
                          <button className="text-red-400 hover:text-red-300">
                            Usuń
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          
          {/* Содержимое вкладки "Комнаты" */}
          {activeTab === 'rooms' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-white">Lista pokoi</h2>
                <button 
                  className="bg-[#f36e21] text-white px-4 py-2 rounded-lg hover:bg-[#e05e11] transition-colors"
                  onClick={handleAddRoom}
                >
                  Dodaj nowy pokój
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {rooms.map((room) => (
                  <div key={room.id} className="bg-gray-800 rounded-lg p-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-medium text-white">Pokój {room.name}</h3>
                        <p className="text-gray-400 mt-1">Maksymalna liczba osób: {room.maxPeople}</p>
                      </div>
                      <div className="flex space-x-2">
                        <button 
                          className="p-2 text-blue-400 hover:text-blue-300"
                          onClick={() => handleEditRoom(room)}
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button 
                          className="p-2 text-red-400 hover:text-red-300"
                          onClick={() => handleDeleteRoom(room.id)}
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-700">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Status:</span>
                        <span className={room.isActive ? "text-green-400" : "text-red-400"}>
                          {room.isActive ? "Aktywny" : "Nieaktywny"}
                        </span>
                      </div>
                      
                      {room.workSchedule && (
                        <div className="mt-2 pt-2 border-t border-gray-700">
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-400">Harmonogram:</span>
                            <button 
                              className="text-[#f36e21] text-xs hover:underline"
                              onClick={() => handleEditRoom(room)}
                            >
                              Zmień harmonogram
                            </button>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            {Object.entries(room.workSchedule).map(([day, schedule]) => {
                              if (!schedule) return null;
                              
                              // Преобразование дня недели для красивого отображения
                              const dayNames: Record<string, string> = {
                                monday: 'Pn',
                                tuesday: 'Wt',
                                wednesday: 'Śr',
                                thursday: 'Cz',
                                friday: 'Pt',
                                saturday: 'So',
                                sunday: 'Nd'
                              };
                              
                              const dayName = dayNames[day as keyof typeof dayNames] || day;
                              
                              return schedule.isActive ? (
                                <div key={day} className="flex justify-between bg-gray-700 p-1 rounded">
                                  <span className="font-medium">{dayName}:</span>
                                  <span>{schedule.startTime} - {schedule.endTime}</span>
                                </div>
                              ) : (
                                <div key={day} className="flex justify-between bg-gray-700/50 p-1 rounded text-gray-500">
                                  <span className="font-medium">{dayName}:</span>
                                  <span>Zamknięte</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Содержимое вкладки "Промо-коды" */}
          {activeTab === 'promocodes' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-white">Lista kodów promocyjnych</h2>
                <button className="bg-[#f36e21] text-white px-4 py-2 rounded-lg hover:bg-[#e05e11] transition-colors">
                  Dodaj nowy kod
                </button>
              </div>
              
              <div className="bg-gray-800 rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-700">
                  <thead className="bg-gray-700">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Kod
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Zniżka (%)
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Ważny do
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Akcje
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-gray-800 divide-y divide-gray-700">
                    {promocodes.map((promo) => {
                      const isValid = new Date(promo.validUntil) > new Date();
                      return (
                        <tr key={promo.code} className="hover:bg-gray-750">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                            {promo.code}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                            {promo.discount}%
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                            {new Date(promo.validUntil).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              isValid 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {isValid ? 'Aktywny' : 'Wygasły'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                            <button className="text-blue-400 hover:text-blue-300 mr-3">
                              Edytuj
                            </button>
                            <button className="text-red-400 hover:text-red-300">
                              Usuń
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          
          {/* Модальное окно редактирования комнаты */}
          {isRoomModalOpen && (
            <RoomEditModal
              room={selectedRoom}
              onClose={() => setIsRoomModalOpen(false)}
              onSave={handleSaveRoom}
            />
          )}
        </>
      )}
    </div>
  );
} 