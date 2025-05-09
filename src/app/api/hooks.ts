/**
 * Файл с хуками для использования моковых данных вместо API
 */

import { useState, useEffect, useCallback } from 'react';
import { Booking, PaymentStatus, BookingFormData } from '@/types/booking';
import { Customer } from '@/types/customer';
import { 
  fetchBookings,
  createBooking as mockCreateBooking, 
  updateBooking as mockUpdateBooking, 
  deleteBooking as mockDeleteBooking,
  fetchCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomer
} from '@/lib/frontend-mocks';

/**
 * Хук для получения списка бронирований
 */
export function useBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Имитируем задержку сети
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const data = await fetchBookings();
      setBookings(data);
    } catch (err) {
      console.error('Error fetching bookings:', err);
      setError('Не удалось загрузить бронирования. Пожалуйста, попробуйте позже.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { bookings, isLoading, error, refetch: fetchData };
}

/**
 * Хук для получения списка клиентов
 */
export function useCustomers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Имитируем задержку сети
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const data = await fetchCustomers();
      setCustomers(data);
    } catch (err) {
      console.error('Error fetching customers:', err);
      setError('Nie udało się załadować klientów. Spróbuj ponownie później.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { customers, isLoading, error, refetch: fetchData };
}

/**
 * Хук для операций с бронированиями (создание, обновление, удаление)
 */
export function useBookingMutations() {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  const create = useCallback(async (bookingData: BookingFormData, paymentStatus: PaymentStatus) => {
    setIsLoading(true);
    setError(null);
    setSuccess(false);
    try {
      console.log('useBookingMutations.create: Получены данные для создания бронирования:', bookingData);
      console.log('useBookingMutations.create: Статус оплаты:', paymentStatus);
      
      // Проверка обязательных полей
      if (!bookingData.packageId) {
        throw new Error('Не указан ID пакета');
      }
      
      if (!bookingData.roomId) {
        throw new Error('Не указана комната');
      }
      
      if (!bookingData.date) {
        throw new Error('Не указана дата');
      }
      
      // Обработка данных
      const bookingToCreate = {
        ...bookingData,
        customerName: bookingData.name || bookingData.customerName,
        customerEmail: bookingData.email || bookingData.customerEmail,
        customerPhone: bookingData.phone || bookingData.customerPhone,
        numPeople: bookingData.numberOfPeople || bookingData.numPeople,
        totalPrice: bookingData.totalAmount || bookingData.totalPrice,
        booking_date: bookingData.date,
        // Преобразуем строковые значения в числовые
        roomId: typeof bookingData.roomId === 'string' ? parseInt(bookingData.roomId, 10) : bookingData.roomId,
        packageId: typeof bookingData.packageId === 'string' ? parseInt(bookingData.packageId, 10) : bookingData.packageId,
        numberOfPeople: typeof bookingData.numberOfPeople === 'string' 
          ? parseInt(bookingData.numberOfPeople, 10) 
          : bookingData.numberOfPeople,
        totalAmount: typeof bookingData.totalAmount === 'string' 
          ? parseFloat(bookingData.totalAmount) 
          : bookingData.totalAmount,
        depositAmount: typeof bookingData.depositAmount === 'string' 
          ? parseFloat(bookingData.depositAmount) 
          : bookingData.depositAmount,
        paidAmount: typeof bookingData.paidAmount === 'string' 
          ? parseFloat(bookingData.paidAmount) 
          : bookingData.paidAmount,
        paymentStatus
      };

      console.log('useBookingMutations.create: Подготовленные данные для создания бронирования:', bookingToCreate);
      
      // Имитируем задержку сети
      await new Promise(resolve => setTimeout(resolve, 500));
      
      try {
        const result = await mockCreateBooking(bookingToCreate);
        console.log('useBookingMutations.create: Успешный ответ от сервера:', result);
        setSuccess(true);
        return result;
      } catch (innerError) {
        console.error('useBookingMutations.create: Ошибка при вызове mockCreateBooking:', innerError);
        throw innerError;
      }
    } catch (err) {
      console.error('useBookingMutations.create: Ошибка создания бронирования:', err);
      setError('Не удалось создать бронирование. Пожалуйста, попробуйте позже.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const update = useCallback(async (bookingId: number | string, updateData: Partial<Booking>) => {
    setIsLoading(true);
    setError(null);
    setSuccess(false);
    try {
      // Имитируем задержку сети
      await new Promise(resolve => setTimeout(resolve, 500));
      const result = await mockUpdateBooking({
        id: bookingId,
        ...updateData
      });
      setSuccess(true);
      return result;
    } catch (err) {
      console.error('Error updating booking:', err);
      setError('Не удалось обновить бронирование. Пожалуйста, попробуйте позже.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const remove = useCallback(async (bookingId: number | string) => {
    setIsLoading(true);
    setError(null);
    setSuccess(false);
    try {
      // Имитируем задержку сети
      await new Promise(resolve => setTimeout(resolve, 500));
      const result = await mockDeleteBooking(Number(bookingId));
      setSuccess(true);
      return result;
    } catch (err) {
      console.error('Error deleting booking:', err);
      setError('Не удалось удалить бронирование. Пожалуйста, попробуйте позже.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Изменение статуса оплаты
  const updatePaymentStatus = async (bookingId: number | string, newStatus: PaymentStatus) => {
    return update(bookingId, { paymentStatus: newStatus });
  };

  // Изменение комментария администратора
  const updateAdminComment = async (bookingId: number | string, comment: string) => {
    return update(bookingId, { adminComment: comment });
  };

  return {
    create,
    update,
    remove,
    updatePaymentStatus,
    updateAdminComment,
    isLoading,
    error,
    success
  };
}

/**
 * Хук для операций с клиентами (создание, обновление, удаление)
 */
export function useCustomerMutations() {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  const create = useCallback(async (customer: any) => {
    setIsLoading(true);
    setError(null);
    setSuccess(false);
    try {
      const result = await createCustomer(customer);
      setSuccess(true);
      return result;
    } catch (err) {
      console.error('Error creating customer:', err);
      setError('Nie udało się utworzyć klienta. Spróbuj ponownie później.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const update = useCallback(async (customer: Customer) => {
    setIsLoading(true);
    setError(null);
    setSuccess(false);
    try {
      const result = await updateCustomer(customer);
      setSuccess(true);
      return result;
    } catch (err) {
      console.error('Error updating customer:', err);
      setError('Nie udało się zaktualizować klienta. Spróbuj ponownie później.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const remove = useCallback(async (customerId: number) => {
    setIsLoading(true);
    setError(null);
    setSuccess(false);
    try {
      await deleteCustomer(customerId);
      setSuccess(true);
    } catch (err) {
      console.error('Error deleting customer:', err);
      setError('Nie udało się usunąć klienta. Spróbuj ponownie później.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    create,
    update,
    remove,
    isLoading,
    error,
    success
  };
}