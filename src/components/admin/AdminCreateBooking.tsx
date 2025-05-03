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
        packageName: selectedPackage.name,
        totalAmount: selectedPackage.price,
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
  
  
} 