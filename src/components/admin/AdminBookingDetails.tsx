'use client';

import { useState } from 'react';
import { Booking, PaymentStatus } from '@/types/booking';
import { format, parseISO } from 'date-fns';
import { pl } from 'date-fns/locale';

export interface AdminBookingDetailsProps {
  booking: Booking;
  onClose: () => void;
  onPaymentStatusChange?: (bookingId: string | number, status: PaymentStatus) => Promise<void>;
  onAdminCommentChange?: (bookingId: string | number, comment: string) => Promise<void>;
  onDelete?: (bookingId: string | number) => Promise<void>;
}

export default function AdminBookingDetails({
  booking,
  onClose,
  onPaymentStatusChange,
  onAdminCommentChange,
  onDelete
}: AdminBookingDetailsProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>(booking.paymentStatus);
  const [adminComment, setAdminComment] = useState(booking.adminComment || '');
  const [error, setError] = useState<string | null>(null);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  // Обработка изменения статуса оплаты
  const handlePaymentStatusChange = async (status: PaymentStatus) => {
    if (!onPaymentStatusChange) return;
    
    setIsUpdating(true);
    setError(null);
    
    try {
      await onPaymentStatusChange(booking.id, status);
      setPaymentStatus(status);
    } catch (err: any) {
      setError(err.message || 'Не удалось обновить статус оплаты');
    } finally {
      setIsUpdating(false);
    }
  };

  // Обработка изменения комментария администратора
  const handleAdminCommentSave = async () => {
    if (!onAdminCommentChange) return;
    
    setIsUpdating(true);
    setError(null);
    
    try {
      await onAdminCommentChange(booking.id, adminComment);
    } catch (err: any) {
      setError(err.message || 'Не удалось сохранить комментарий');
    } finally {
      setIsUpdating(false);
    }
  };

  // Обработка удаления бронирования
  const handleDelete = async () => {
    if (!onDelete) return;
    
    setIsUpdating(true);
    setError(null);
    
    try {
      await onDelete(booking.id);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Не удалось удалить бронирование');
      setIsUpdating(false);
      setIsConfirmingDelete(false);
    }
  };

  // Получение класса стиля для статуса оплаты
  const getPaymentStatusClass = (status: PaymentStatus) => {
    switch (status) {
      case 'FULLY_PAID':
        return 'bg-green-600 hover:bg-green-700';
      case 'DEPOSIT_PAID':
        return 'bg-yellow-600 hover:bg-yellow-700';
      case 'UNPAID':
        return 'bg-red-600 hover:bg-red-700';
      default:
        return 'bg-gray-600 hover:bg-gray-700';
    }
  };

  // Получение текста для статуса оплаты
  const getPaymentStatusText = (status: PaymentStatus) => {
    switch (status) {
      case 'FULLY_PAID':
        return 'Opłacone';
      case 'DEPOSIT_PAID':
        return 'Zaliczka';
      case 'UNPAID':
        return 'Nieopłacone';
      default:
        return status;
    }
  };
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="bg-gray-800 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-auto shadow-xl">
        <div className="sticky top-0 bg-gray-800 p-4 border-b border-gray-700 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-white">Szczegóły rezerwacji</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="p-4 space-y-6">
          {/* Основная информация */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-lg font-medium text-white mb-2">Информация о бронировании</h3>
              <table className="w-full">
                <tbody className="divide-y divide-gray-700">
                  <tr>
                    <td className="py-2 text-gray-400">ID</td>
                    <td className="py-2 text-white font-medium">{booking.id}</td>
                  </tr>
                  <tr>
                    <td className="py-2 text-gray-400">Дата</td>
                    <td className="py-2 text-white font-medium">
                      {booking.date && format(new Date(booking.date), 'd MMMM yyyy', { locale: pl })}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 text-gray-400">Время</td>
                    <td className="py-2 text-white font-medium">
                      {booking.startTime} - {booking.endTime}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 text-gray-400">Пакет</td>
                    <td className="py-2 text-white font-medium">{booking.packageName}</td>
                  </tr>
                  <tr>
                    <td className="py-2 text-gray-400">Комната</td>
                    <td className="py-2 text-white font-medium">{booking.roomId}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-white mb-2">Информация о клиенте</h3>
              <table className="w-full">
                <tbody className="divide-y divide-gray-700">
                  <tr>
                    <td className="py-2 text-gray-400">Имя</td>
                    <td className="py-2 text-white font-medium">{booking.name}</td>
                  </tr>
                  <tr>
                    <td className="py-2 text-gray-400">Email</td>
                    <td className="py-2 text-white font-medium">{booking.email}</td>
                  </tr>
                  <tr>
                    <td className="py-2 text-gray-400">Телефон</td>
                    <td className="py-2 text-white font-medium">{booking.phone}</td>
                  </tr>
                  <tr>
                    <td className="py-2 text-gray-400">Кол-во человек</td>
                    <td className="py-2 text-white font-medium">{booking.numberOfPeople}</td>
                  </tr>
                  <tr>
                    <td className="py-2 text-gray-400">Промокод</td>
                    <td className="py-2 text-white font-medium">{booking.promoCode || '-'}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          
          {/* Комментарий клиента */}
          {booking.comment && (
            <div>
              <h3 className="text-lg font-medium text-white mb-2">Комментарий клиента</h3>
              <div className="bg-gray-700 p-3 rounded-md text-white">
                {booking.comment}
              </div>
            </div>
          )}
          
          {/* Комментарий администратора */}
          <div>
            <h3 className="text-lg font-medium text-white mb-2">Комментарий администратора</h3>
            <textarea
              value={adminComment}
              onChange={(e) => setAdminComment(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-md p-3 text-white resize-none focus:outline-none focus:ring-2 focus:ring-amber-500"
              rows={3}
              placeholder="Добавить комментарий"
            ></textarea>
            {onAdminCommentChange && (
              <button
                onClick={handleAdminCommentSave}
                disabled={isUpdating}
                className="mt-2 px-4 py-2 bg-amber-500 text-white rounded-md hover:bg-amber-600 transition-colors disabled:opacity-50"
              >
                {isUpdating ? 'Сохранение...' : 'Сохранить комментарий'}
              </button>
            )}
          </div>
          
          {/* Оплата */}
          <div>
            <h3 className="text-lg font-medium text-white mb-2">Оплата</h3>
            <div className="bg-gray-700 p-4 rounded-md">
              <div className="flex justify-between mb-2">
                <span className="text-gray-400">Всего:</span>
                <span className="text-white font-medium">{booking.totalAmount} PLN</span>
              </div>
              <div className="flex justify-between mb-4">
                <span className="text-gray-400">Оплачено:</span>
                <span className="text-white font-medium">{booking.paidAmount || 0} PLN</span>
              </div>
              
              {onPaymentStatusChange && (
                <div className="space-y-2">
                  <div className="text-gray-400 mb-1">Статус оплаты:</div>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => handlePaymentStatusChange('UNPAID')}
                      disabled={isUpdating || paymentStatus === 'UNPAID'}
                      className={`px-3 py-2 rounded-md text-white text-sm transition-colors ${
                        paymentStatus === 'UNPAID' 
                          ? 'bg-red-700' 
                          : 'bg-red-600/50 hover:bg-red-600'
                      } disabled:opacity-50`}
                    >
                      Nieopłacone
                    </button>
                    <button
                      onClick={() => handlePaymentStatusChange('DEPOSIT_PAID')}
                      disabled={isUpdating || paymentStatus === 'DEPOSIT_PAID'}
                      className={`px-3 py-2 rounded-md text-white text-sm transition-colors ${
                        paymentStatus === 'DEPOSIT_PAID' 
                          ? 'bg-yellow-700' 
                          : 'bg-yellow-600/50 hover:bg-yellow-600'
                      } disabled:opacity-50`}
                    >
                      Zaliczka
                    </button>
                    <button
                      onClick={() => handlePaymentStatusChange('FULLY_PAID')}
                      disabled={isUpdating || paymentStatus === 'FULLY_PAID'}
                      className={`px-3 py-2 rounded-md text-white text-sm transition-colors ${
                        paymentStatus === 'FULLY_PAID' 
                          ? 'bg-green-700' 
                          : 'bg-green-600/50 hover:bg-green-600'
                      } disabled:opacity-50`}
                    >
                      Opłacone
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Ошибка */}
          {error && (
            <div className="bg-red-900/50 border border-red-500 p-3 rounded-md text-white">
              {error}
            </div>
          )}
          
          {/* Кнопка удаления */}
          {onDelete && (
            <div className="border-t border-gray-700 pt-4">
              {!isConfirmingDelete ? (
                <button
                  onClick={() => setIsConfirmingDelete(true)}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                >
                  Удалить бронирование
                </button>
              ) : (
                <div className="bg-red-900/30 p-3 rounded-md border border-red-600">
                  <p className="text-white mb-3">Вы уверены, что хотите удалить это бронирование? Это действие нельзя отменить.</p>
                  <div className="flex space-x-3">
                    <button
                      onClick={handleDelete}
                      disabled={isUpdating}
                      className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50"
                    >
                      {isUpdating ? 'Удаление...' : 'Да, удалить'}
                    </button>
                    <button
                      onClick={() => setIsConfirmingDelete(false)}
                      disabled={isUpdating}
                      className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors disabled:opacity-50"
                    >
                      Отмена
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 