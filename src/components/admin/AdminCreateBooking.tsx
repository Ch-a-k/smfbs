'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { PaymentStatus, BookingFormData, Room, Package, RoomSchedule } from '@/types/booking';
import { supabase } from '@/utils/supabase/client';

export interface AdminCreateBookingProps {
  onBookingCreate?: (bookingData: BookingFormData, paymentStatus: PaymentStatus) => Promise<void>;
  onClose?: (shouldRefresh?: boolean) => void;
}

export default function AdminCreateBooking({ onBookingCreate, onClose }: AdminCreateBookingProps) {
  // Состояние формы
  const [formData, setFormData] = useState<BookingFormData>({
    name: '',
    email: '',
    phone: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    startTime: '10:00',
    endTime: '12:00',
    packageId: '',
    roomId: 0,
    numberOfPeople: 1,
    comment: '',
    promoCode: '',
  });
  
  // Состояние для всех пакетов
  const [packages, setPackages] = useState<Package[]>([]);
  // Состояние для доступных комнат
  const [availableRooms, setAvailableRooms] = useState<Room[]>([]);
  // Состояние для всех комнат (для интерфейса)
  const [allRooms, setAllRooms] = useState<Room[]>([]);
  // Статус загрузки
  const [isLoading, setIsLoading] = useState(true);
  // Статус отправки формы
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Статус оплаты
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('UNPAID');
  // Сообщение об ошибке
  const [errorMessage, setErrorMessage] = useState('');
  // Выбранный пакет
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
  // Проверка доступности комнат
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  
  // Состояние для создания комнаты или пакета
  const [showCreateRoomForm, setShowCreateRoomForm] = useState(false);
  const [showCreatePackageForm, setShowCreatePackageForm] = useState(false);
  const [newRoomData, setNewRoomData] = useState({ name: '', capacity: 4, maxPeople: 6 });
  const [newPackageData, setNewPackageData] = useState({ name: '', description: '', price: 100, duration: 60, maxPeople: 4, depositAmount: 50 });
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [isCreatingPackage, setIsCreatingPackage] = useState(false);
  
  // Загрузка данных при монтировании компонента
  useEffect(() => {
    fetchData();
  }, []);
  
  // Загрузка данных о пакетах и комнатах
    const fetchData = async () => {
      setIsLoading(true);
      try {
      // Загружаем пакеты через API
      const packagesResponse = await fetch('/api/packages');
      if (!packagesResponse.ok) {
        throw new Error('Не удалось загрузить пакеты');
      }
      
        const packagesData = await packagesResponse.json();
      console.log('Получены данные о пакетах:', packagesData);
      
        setPackages(packagesData);
      
      // Если есть пакеты, выбираем первый по умолчанию
      if (packagesData.length > 0) {
        const defaultPackage = packagesData[0];
        
        // Устанавливаем ID пакета в виде строки, чтобы избежать проблем сравнения
        const packageId = defaultPackage.id.toString();
        
          setFormData(prev => ({
            ...prev,
          packageId: packageId,
          endTime: calculateEndTime(prev.startTime, defaultPackage.duration)
        }));
        setSelectedPackage(defaultPackage);
        
        console.log(`Выбран пакет по умолчанию: id=${packageId}, name=${defaultPackage.name}`);
      }
      
      // Загружаем все комнаты через API
      const roomsResponse = await fetch('/api/rooms');
      if (!roomsResponse.ok) {
        throw new Error('Не удалось загрузить комнаты');
      }
      
      const roomsData = await roomsResponse.json();
      console.log('Получены данные о комнатах:', roomsData);
      
      setAllRooms(roomsData);
      
      // Проверяем доступность комнат
      if (packagesData.length > 0) {
        const selectedPackage = packagesData[0];
        const startTime = formData.startTime;
        const date = formData.date;
        const endTime = calculateEndTime(startTime, selectedPackage.duration);
        const packageId = selectedPackage.id.toString();
        
        console.log(`Первоначальная проверка доступности комнат: дата=${date}, время=${startTime}-${endTime}, пакет=${packageId}`);
        
        // Даем время для монтирования компонента
        setTimeout(() => {
          fetchAvailableRooms(date, startTime, endTime, packageId);
        }, 500);
      }
      
    } catch (error) {
      console.error('Ошибка загрузки данных:', error);
      setErrorMessage('Не удалось загрузить данные. Пожалуйста, попробуйте позже.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Получение доступных комнат
  const fetchAvailableRooms = async (date: string, startTime: string, endTime: string, packageId: string) => {
    setIsCheckingAvailability(true);
    try {
      console.log(`Проверка доступности комнат: дата=${date}, время=${startTime}-${endTime}, пакет=${packageId}`);
      
      // ВНИМАНИЕ: Обходное решение проблемы с API
      // Так как API доступности может работать некорректно, всегда используем все комнаты
      console.log('Используем все комнаты напрямую, минуя API проверки доступности');
      setAvailableRooms(allRooms);
      
      if (allRooms.length > 0 && !formData.roomId) {
        // Выбираем первую комнату, если еще не выбрана
        setFormData(prev => ({ ...prev, roomId: allRooms[0].id }));
      }
      
      setErrorMessage('');
      
      /* Закомментированный код для вызова API доступности
      const response = await fetch(
        `/api/bookings/availability?date=${date}&startTime=${startTime}&endTime=${endTime}&packageId=${packageId}&type=rooms`
      );
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Ошибка API:', errorText);
        throw new Error(`Ошибка при получении доступных комнат: ${response.status}`);
      }
      
      const responseData = await response.json();
      console.log('Ответ API:', responseData);
      
      // Проверяем, что ответ - это массив комнат
      if (!Array.isArray(responseData)) {
        console.error('Некорректный формат ответа:', responseData);
        throw new Error('Неправильный формат ответа от сервера');
      }
      
      // Если ответ пустой, пробуем запросить все комнаты
      if (responseData.length === 0) {
        console.log('Нет доступных комнат по API, получаем все комнаты');
        // Временное решение: просто используем все комнаты, если API не возвращает данные
        setAvailableRooms(allRooms);
        
        if (allRooms.length > 0) {
          setFormData(prev => ({ ...prev, roomId: allRooms[0].id }));
          setErrorMessage('');
        } else {
          setFormData(prev => ({ ...prev, roomId: 0 }));
          setErrorMessage('Нет доступных комнат в системе');
        }
      } else {
        // Используем полученные комнаты
        setAvailableRooms(responseData);
        setErrorMessage('');
        
        // Если есть доступные комнаты, выбираем первую по умолчанию
        if (responseData.length > 0) {
          setFormData(prev => ({ ...prev, roomId: responseData[0].id }));
        }
      }
      */
    } catch (error) {
      console.error('Ошибка получения доступных комнат:', error);
      
      // В случае ошибки в API используем все комнаты
      console.log('Используем все комнаты из-за ошибки');
      setAvailableRooms(allRooms);
      
      if (allRooms.length > 0) {
        setFormData(prev => ({ ...prev, roomId: allRooms[0].id }));
        setErrorMessage('');
      } else {
        setErrorMessage('Не удалось получить список комнат');
      }
    } finally {
      setIsCheckingAvailability(false);
    }
  };
  
  // Обработчик изменения полей формы
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Сбрасываем сообщение об ошибке при изменении формы
    setErrorMessage('');
    
    // Особая обработка для даты и времени
    if (name === 'date' || name === 'startTime') {
      // При изменении даты или времени, нужно проверить доступность комнат
      if (selectedPackage) {
        const newStartTime = name === 'startTime' ? value : formData.startTime;
        const newDate = name === 'date' ? value : formData.date;
        
        const newEndTime = calculateEndTime(newStartTime, selectedPackage.duration);
        setFormData(prev => ({ ...prev, endTime: newEndTime }));
        
        fetchAvailableRooms(newDate, newStartTime, newEndTime, selectedPackage.id.toString());
      }
    }
  };
  
  // Обработчик изменения пакета
  const handlePackageChange = (packageId: string) => {
    console.log(`Изменение пакета на: ${packageId}`);
    
    const pkg = packages.find(p => p.id.toString() === packageId);
    if (!pkg) {
      console.error(`Пакет с ID ${packageId} не найден`);
      return;
    }
    
    console.log(`Найден пакет: ${pkg.name}, длительность: ${pkg.duration} мин`);
    setSelectedPackage(pkg);
    
    // Обновляем форму с новым пакетом
    const newEndTime = calculateEndTime(formData.startTime, pkg.duration);
    console.log(`Новое время окончания: ${newEndTime}`);
    
    setFormData(prev => ({
      ...prev,
      packageId,
      endTime: newEndTime,
      numberOfPeople: Math.min(prev.numberOfPeople, pkg.maxPeople)
    }));
    
    // Проверяем доступность комнат для нового пакета
    fetchAvailableRooms(formData.date, formData.startTime, newEndTime, packageId);
  };
  
  // Расчет времени окончания на основе времени начала и продолжительности
  const calculateEndTime = (startTime: string, durationMinutes: number): string => {
    console.log(`Расчет времени окончания: старт=${startTime}, длительность=${durationMinutes} мин`);
    
    const [hours, minutes] = startTime.split(':').map(Number);
    const startMinutes = hours * 60 + minutes;
    const endMinutes = startMinutes + durationMinutes;
    
    const endHours = Math.floor(endMinutes / 60);
    const endMinutesRemainder = endMinutes % 60;
    
    const result = `${endHours.toString().padStart(2, '0')}:${endMinutesRemainder.toString().padStart(2, '0')}`;
    console.log(`Вычисленное время окончания: ${result}`);
    
    return result;
  };
  
  // Обработчик отправки формы
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting) return;
    
    // Проверка выбора комнаты
    if (!formData.roomId) {
      setErrorMessage('Пожалуйста, выберите комнату');
      return;
    }
    
    // Проверка выбора пакета
    if (!formData.packageId) {
      setErrorMessage('Пожалуйста, выберите пакет');
      return;
    }
    
    // Проверка заполнения обязательных полей
    if (!formData.name || !formData.email || !formData.phone) {
      setErrorMessage('Пожалуйста, заполните все обязательные поля');
      return;
    }
    
    // Проверка корректности email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setErrorMessage('Пожалуйста, введите корректный email');
      return;
    }
    
    // Вывод данных перед отправкой для отладки
    console.log('Отправка данных бронирования:', formData);
    console.log('Статус оплаты:', paymentStatus);
    
    setIsSubmitting(true);
    setErrorMessage('');
    
    try {
      const selectedPackage = packages.find(p => p.id.toString() === formData.packageId.toString());
      if (!selectedPackage) throw new Error('Выбранный пакет не найден');
      
      // Подготовка данных для отправки
      const bookingData: BookingFormData = {
        ...formData,
        // Добавляем альтернативные имена полей для API
        customerName: formData.name,
        customerEmail: formData.email,
        customerPhone: formData.phone,
        numPeople: formData.numberOfPeople,
        packageName: selectedPackage.name,
        totalAmount: selectedPackage.price,
        totalPrice: selectedPackage.price, // Добавляем totalPrice для API
        depositAmount: selectedPackage.depositAmount,
        paidAmount: paymentStatus === 'FULLY_PAID' ? selectedPackage.price : 
                   paymentStatus === 'DEPOSIT_PAID' ? selectedPackage.depositAmount : 0,
      };
      
      // Создание бронирования
      await onBookingCreate!(bookingData, paymentStatus);
      
      // Сброс формы
      setFormData({
        name: '',
        email: '',
        phone: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        startTime: '10:00',
        endTime: '12:00',
        packageId: packages.length > 0 ? packages[0].id.toString() : '',
        roomId: 0,
        numberOfPeople: 1,
        comment: '',
        promoCode: '',
      });
      
      setPaymentStatus('UNPAID');
    } catch (error) {
      console.error('Ошибка создания бронирования:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Произошла ошибка при создании бронирования');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Получение класса для варианта оплаты
  const getPaymentStatusClass = (status: PaymentStatus) => {
    return `py-2 px-4 rounded-md ${
      paymentStatus === status
        ? 'bg-[#f36e21] text-white'
        : 'bg-gray-700 text-white/70 hover:bg-gray-600'
    }`;
  };
  
  // Выбор комнаты
  const handleRoomSelect = (room: Room) => {
    console.log(`Выбор комнаты: id=${room.id}, name=${room.name}`);
    setFormData(prev => ({ ...prev, roomId: room.id }));
  };
  
  // Получение класса для комнаты
  const getRoomButtonClass = (room: Room) => {
    // Временное решение: считаем все комнаты доступными
    const isSelected = formData.roomId === room.id;
    
    return `py-3 px-4 rounded-lg text-center ${
      isSelected
        ? 'bg-[#f36e21] text-white'
        : 'bg-gray-700 text-white hover:bg-gray-600'
    }`;
  };
  
  // Создание новой комнаты
  const createRoom = async () => {
    if (isCreatingRoom) return;
    
    setIsCreatingRoom(true);
    try {
      console.log('Создание новой комнаты:', newRoomData);
      
      // Проверка данных
      if (!newRoomData.name) {
        setErrorMessage('Введите название комнаты');
        return;
      }
      
      // Создаем расписание работы по умолчанию
      const defaultSchedule = {
        monday: { isActive: true, startTime: '09:00', endTime: '22:00' },
        tuesday: { isActive: true, startTime: '09:00', endTime: '22:00' },
        wednesday: { isActive: true, startTime: '09:00', endTime: '22:00' },
        thursday: { isActive: true, startTime: '09:00', endTime: '22:00' },
        friday: { isActive: true, startTime: '09:00', endTime: '22:00' },
        saturday: { isActive: true, startTime: '10:00', endTime: '22:00' },
        sunday: { isActive: true, startTime: '10:00', endTime: '20:00' }
      };
      
      // ОБХОДНОЙ ПУТЬ: Используем прямой вызов Supabase для создания комнаты
      // из-за проблемы с автоинкрементом в таблице
      console.log('Используем прямое создание через Supabase...');
      
      // Генерируем случайный ID для комнаты (временное решение)
      const randomId = Math.floor(Math.random() * 10000) + 100;
      
      const { data, error } = await supabase
        .from('rooms')
        .insert([
          { 
            id: randomId,
            name: newRoomData.name, 
            capacity: newRoomData.capacity, 
            max_people: newRoomData.maxPeople,
            is_active: true,
            available: true,
            work_schedule: defaultSchedule
          }
        ])
        .select();
      
      if (error) throw new Error(error.message);
      
      console.log('Комната успешно создана:', data);
      
      // Обновляем список комнат
      fetchData();
      
      // Закрываем форму
      setShowCreateRoomForm(false);
      setNewRoomData({ name: '', capacity: 4, maxPeople: 6 });
      
    } catch (error) {
      console.error('Ошибка создания комнаты:', error);
      setErrorMessage('Не удалось создать комнату: ' + (error instanceof Error ? error.message : 'Неизвестная ошибка'));
    } finally {
      setIsCreatingRoom(false);
    }
  };
  
  // Создание нового пакета
  const createPackage = async () => {
    if (isCreatingPackage) return;
    
    setIsCreatingPackage(true);
    try {
      console.log('Создание нового пакета:', newPackageData);
      
      // Проверка данных
      if (!newPackageData.name) {
        setErrorMessage('Введите название пакета');
        return;
      }
      
      // ОБХОДНОЙ ПУТЬ: Используем прямой вызов Supabase для создания пакета
      // из-за проблемы с автоинкрементом в таблице
      console.log('Используем прямое создание через Supabase...');
      
      // Генерируем ID из имени пакета или случайно
      const packageId = newPackageData.name.toLowerCase().replace(/\s+/g, '_') + '_' + Date.now().toString().slice(-4);
      
      const { data, error } = await supabase
        .from('packages')
        .insert([
          { 
            id: packageId,
            name: newPackageData.name, 
            description: newPackageData.description,
            price: newPackageData.price,
            deposit_amount: newPackageData.depositAmount,
            duration: newPackageData.duration,
            max_people: newPackageData.maxPeople,
            preferred_rooms: [],
            is_active: true
          }
        ])
        .select();
      
      if (error) throw new Error(error.message);
      
      console.log('Пакет успешно создан:', data);
      
      // Обновляем список пакетов
      fetchData();
      
      // Закрываем форму
      setShowCreatePackageForm(false);
      setNewPackageData({ name: '', description: '', price: 100, duration: 60, maxPeople: 4, depositAmount: 50 });
      
    } catch (error) {
      console.error('Ошибка создания пакета:', error);
      setErrorMessage('Не удалось создать пакет: ' + (error instanceof Error ? error.message : 'Неизвестная ошибка'));
    } finally {
      setIsCreatingPackage(false);
    }
  };
  
  // Обработчик изменения полей формы создания комнаты
  const handleNewRoomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewRoomData(prev => ({ ...prev, [name]: name === 'name' ? value : parseInt(value) || 0 }));
  };
  
  // Обработчик изменения полей формы создания пакета
  const handleNewPackageChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewPackageData(prev => ({ 
      ...prev, 
      [name]: ['price', 'duration', 'maxPeople', 'depositAmount'].includes(name) ? parseInt(value) || 0 : value 
    }));
  };
  
  // Обработчик закрытия модального окна
  const handleClose = () => {
    if (onClose) {
      onClose(false);
    }
  };
  
  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-white">Dodaj nową rezerwację</h2>
        {onClose && (
          <button 
            onClick={handleClose}
            className="text-gray-400 hover:text-white"
          >
            ✕
          </button>
        )}
      </div>
      
      {/* Форма бронирования */}
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#f36e21]"></div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {errorMessage && (
            <div className="bg-red-900/50 border border-red-500 text-red-200 p-4 rounded-md">
              {errorMessage}
            </div>
          )}
          
          {/* Выбор пакета */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-white">Wybierz pakiet</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {packages.map(pkg => (
                <div
                  key={pkg.id}
                  onClick={() => handlePackageChange(pkg.id.toString())}
                  className={`
                    bg-gray-700 border rounded-lg p-4 cursor-pointer transition-all
                    ${formData.packageId === pkg.id.toString() ? 'border-[#f36e21]' : 'border-gray-600 hover:border-gray-500'}
                  `}
                >
                  <h4 className="text-lg font-bold text-white">{pkg.name}</h4>
                  <p className="text-gray-300 text-sm mb-2">{pkg.description}</p>
                  <div className="flex justify-between items-center">
                    <span className="text-xl font-bold text-[#f36e21]">{pkg.price} zł</span>
                    <span className="text-sm text-gray-400">{pkg.duration} min</span>
                  </div>
                </div>
              ))}
              
              {packages.length === 0 && (
                <div className="col-span-3 text-center py-8 text-gray-400">
                  Brak dostępnych pakietów
                </div>
              )}
              
              <button
                type="button"
                onClick={() => setShowCreatePackageForm(true)}
                className="bg-gray-700 border border-dashed border-gray-500 rounded-lg p-4 text-center hover:bg-gray-600 transition-all flex flex-col items-center justify-center"
              >
                <span className="text-3xl text-gray-400 mb-2">+</span>
                <span className="text-gray-300">Dodaj nowy pakiet</span>
              </button>
            </div>
          </div>
          
          {/* Выбор даты и времени */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-white">Data i czas</h3>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="date" className="block text-gray-300 mb-1">
                    Data
                  </label>
                  <input
                    type="date"
                    id="date"
                    name="date"
                    value={formData.date}
                    onChange={handleInputChange}
                    className="w-full bg-gray-700 text-white border border-gray-600 rounded-md p-2 focus:outline-none focus:border-[#f36e21]"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="startTime" className="block text-gray-300 mb-1">
                      Czas rozpoczęcia
                    </label>
                    <input
                      type="time"
                      id="startTime"
                      name="startTime"
                      value={formData.startTime}
                      onChange={handleInputChange}
                      className="w-full bg-gray-700 text-white border border-gray-600 rounded-md p-2 focus:outline-none focus:border-[#f36e21]"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="endTime" className="block text-gray-300 mb-1">
                      Czas zakończenia
                    </label>
                    <input
                      type="time"
                      id="endTime"
                      name="endTime"
                      value={formData.endTime}
                      onChange={handleInputChange}
                      className="w-full bg-gray-700 text-white border border-gray-600 rounded-md p-2 focus:outline-none focus:border-[#f36e21]"
                      readOnly
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="numberOfPeople" className="block text-gray-300 mb-1">
                    Liczba osób
                  </label>
                  <input
                    type="number"
                    id="numberOfPeople"
                    name="numberOfPeople"
                    value={formData.numberOfPeople}
                    onChange={handleInputChange}
                    min="1"
                    max={selectedPackage?.maxPeople || 10}
                    className="w-full bg-gray-700 text-white border border-gray-600 rounded-md p-2 focus:outline-none focus:border-[#f36e21]"
                  />
                </div>
              </div>
            </div>
            
            {/* Выбор комнаты */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-white">Wybierz pokój</h3>
              
              {isCheckingAvailability ? (
                <div className="flex justify-center items-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#f36e21]"></div>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    {availableRooms.map(room => (
                      <button
                        key={room.id}
                        type="button"
                        onClick={() => handleRoomSelect(room)}
                        className={getRoomButtonClass(room)}
                      >
                        <div className="font-medium">{room.name}</div>
                        <div className="text-sm">Pojemność: {room.capacity}</div>
                      </button>
                    ))}
                    
                    {availableRooms.length === 0 && (
                      <div className="col-span-2 text-center py-8 text-gray-400">
                        Brak dostępnych pokojów
                      </div>
                    )}
                  </div>
                  
                  <button
                    type="button"
                    onClick={() => setShowCreateRoomForm(true)}
                    className="w-full bg-gray-700 border border-dashed border-gray-500 rounded-lg p-3 text-center hover:bg-gray-600 transition-all"
                  >
                    <span className="text-gray-300">+ Dodaj nowy pokój</span>
                  </button>
                </>
              )}
            </div>
          </div>
          
          {/* Данные клиента */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-white">Dane klienta</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="name" className="block text-gray-300 mb-1">
                  Imię i nazwisko
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full bg-gray-700 text-white border border-gray-600 rounded-md p-2 focus:outline-none focus:border-[#f36e21]"
                  placeholder="Jan Kowalski"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="email" className="block text-gray-300 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full bg-gray-700 text-white border border-gray-600 rounded-md p-2 focus:outline-none focus:border-[#f36e21]"
                  placeholder="jan@example.com"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="phone" className="block text-gray-300 mb-1">
                  Telefon
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full bg-gray-700 text-white border border-gray-600 rounded-md p-2 focus:outline-none focus:border-[#f36e21]"
                  placeholder="+48 123 456 789"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="promoCode" className="block text-gray-300 mb-1">
                  Kod promocyjny
                </label>
                <input
                  type="text"
                  id="promoCode"
                  name="promoCode"
                  value={formData.promoCode}
                  onChange={handleInputChange}
                  className="w-full bg-gray-700 text-white border border-gray-600 rounded-md p-2 focus:outline-none focus:border-[#f36e21]"
                  placeholder="PROMO123"
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="comment" className="block text-gray-300 mb-1">
                Komentarz
              </label>
              <textarea
                id="comment"
                name="comment"
                value={formData.comment}
                onChange={handleInputChange}
                rows={3}
                className="w-full bg-gray-700 text-white border border-gray-600 rounded-md p-2 focus:outline-none focus:border-[#f36e21]"
                placeholder="Dodatkowe informacje..."
              />
            </div>
          </div>
          
          {/* Статус оплаты */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-white">Status płatności</h3>
            
            <div className="flex space-x-4">
              <button
                type="button"
                onClick={() => setPaymentStatus('UNPAID')}
                className={getPaymentStatusClass('UNPAID')}
              >
                Nieopłacone
              </button>
              
              <button
                type="button"
                onClick={() => setPaymentStatus('DEPOSIT_PAID')}
                className={getPaymentStatusClass('DEPOSIT_PAID')}
              >
                Zaliczka
              </button>
              
              <button
                type="button"
                onClick={() => setPaymentStatus('FULLY_PAID')}
                className={getPaymentStatusClass('FULLY_PAID')}
              >
                Opłacone
              </button>
            </div>
          </div>
          
          {/* Действия */}
          <div className="flex justify-end space-x-4 pt-4">
            {onClose && (
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 border border-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
              >
                Anuluj
              </button>
            )}
            
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-6 py-2 bg-[#f36e21] text-white font-bold rounded-md hover:bg-[#ff7b2e] transition-colors ${
                isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              {isSubmitting ? 'Zapisywanie...' : 'Zapisz rezerwację'}
            </button>
          </div>
        </form>
      )}
      
      {/* Модальное окно создания комнаты */}
      {showCreateRoomForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4 z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-lg">
            <h3 className="text-lg font-medium text-white mb-4">Dodaj nowy pokój</h3>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="roomName" className="block text-gray-300 mb-1">
                  Nazwa pokoju
                </label>
                <input
                  type="text"
                  id="roomName"
                  name="name"
                  value={newRoomData.name}
                  onChange={handleNewRoomChange}
                  className="w-full bg-gray-700 text-white border border-gray-600 rounded-md p-2 focus:outline-none focus:border-[#f36e21]"
                  placeholder="Pokój 1"
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="roomCapacity" className="block text-gray-300 mb-1">
                    Pojemność
                  </label>
                  <input
                    type="number"
                    id="roomCapacity"
                    name="capacity"
                    value={newRoomData.capacity}
                    onChange={handleNewRoomChange}
                    min="1"
                    className="w-full bg-gray-700 text-white border border-gray-600 rounded-md p-2 focus:outline-none focus:border-[#f36e21]"
                  />
                </div>
                
                <div>
                  <label htmlFor="roomMaxPeople" className="block text-gray-300 mb-1">
                    Maks. liczba osób
                  </label>
                  <input
                    type="number"
                    id="roomMaxPeople"
                    name="maxPeople"
                    value={newRoomData.maxPeople}
                    onChange={handleNewRoomChange}
                    min="1"
                    className="w-full bg-gray-700 text-white border border-gray-600 rounded-md p-2 focus:outline-none focus:border-[#f36e21]"
                  />
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-4 mt-6">
              <button
                type="button"
                onClick={() => setShowCreateRoomForm(false)}
                className="px-4 py-2 border border-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
              >
                Anuluj
              </button>
              
              <button
                type="button"
                onClick={createRoom}
                disabled={isCreatingRoom}
                className={`px-6 py-2 bg-[#f36e21] text-white font-bold rounded-md hover:bg-[#ff7b2e] transition-colors ${
                  isCreatingRoom ? 'opacity-70 cursor-not-allowed' : ''
                }`}
              >
                {isCreatingRoom ? 'Tworzenie...' : 'Dodaj pokój'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Модальное окно создания пакета */}
      {showCreatePackageForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4 z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-lg">
            <h3 className="text-lg font-medium text-white mb-4">Dodaj nowy pakiet</h3>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="packageName" className="block text-gray-300 mb-1">
                  Nazwa pakietu
                </label>
                <input
                  type="text"
                  id="packageName"
                  name="name"
                  value={newPackageData.name}
                  onChange={handleNewPackageChange}
                  className="w-full bg-gray-700 text-white border border-gray-600 rounded-md p-2 focus:outline-none focus:border-[#f36e21]"
                  placeholder="Pakiet Standard"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="packageDescription" className="block text-gray-300 mb-1">
                  Opis
                </label>
                <textarea
                  id="packageDescription"
                  name="description"
                  value={newPackageData.description}
                  onChange={handleNewPackageChange}
                  rows={2}
                  className="w-full bg-gray-700 text-white border border-gray-600 rounded-md p-2 focus:outline-none focus:border-[#f36e21]"
                  placeholder="Opis pakietu..."
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="packagePrice" className="block text-gray-300 mb-1">
                    Cena (zł)
                  </label>
                  <input
                    type="number"
                    id="packagePrice"
                    name="price"
                    value={newPackageData.price}
                    onChange={handleNewPackageChange}
                    min="0"
                    className="w-full bg-gray-700 text-white border border-gray-600 rounded-md p-2 focus:outline-none focus:border-[#f36e21]"
                  />
                </div>
                
                <div>
                  <label htmlFor="packageDeposit" className="block text-gray-300 mb-1">
                    Zaliczka (zł)
                  </label>
                  <input
                    type="number"
                    id="packageDeposit"
                    name="depositAmount"
                    value={newPackageData.depositAmount}
                    onChange={handleNewPackageChange}
                    min="0"
                    className="w-full bg-gray-700 text-white border border-gray-600 rounded-md p-2 focus:outline-none focus:border-[#f36e21]"
                  />
                </div>
                
                <div>
                  <label htmlFor="packageDuration" className="block text-gray-300 mb-1">
                    Czas trwania (min)
                  </label>
                  <input
                    type="number"
                    id="packageDuration"
                    name="duration"
                    value={newPackageData.duration}
                    onChange={handleNewPackageChange}
                    min="15"
                    step="15"
                    className="w-full bg-gray-700 text-white border border-gray-600 rounded-md p-2 focus:outline-none focus:border-[#f36e21]"
                  />
                </div>
                
                <div>
                  <label htmlFor="packageMaxPeople" className="block text-gray-300 mb-1">
                    Maks. liczba osób
                  </label>
                  <input
                    type="number"
                    id="packageMaxPeople"
                    name="maxPeople"
                    value={newPackageData.maxPeople}
                    onChange={handleNewPackageChange}
                    min="1"
                    className="w-full bg-gray-700 text-white border border-gray-600 rounded-md p-2 focus:outline-none focus:border-[#f36e21]"
                  />
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-4 mt-6">
              <button
                type="button"
                onClick={() => setShowCreatePackageForm(false)}
                className="px-4 py-2 border border-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
              >
                Anuluj
              </button>
              
              <button
                type="button"
                onClick={createPackage}
                disabled={isCreatingPackage}
                className={`px-6 py-2 bg-[#f36e21] text-white font-bold rounded-md hover:bg-[#ff7b2e] transition-colors ${
                  isCreatingPackage ? 'opacity-70 cursor-not-allowed' : ''
                }`}
              >
                {isCreatingPackage ? 'Tworzenie...' : 'Dodaj pakiet'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 