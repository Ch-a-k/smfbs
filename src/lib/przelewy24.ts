import { createHash } from 'crypto';
import config from '@/config/przelewy24';
import { Booking } from '@/types/booking';

// Интерфейсы для работы с API Przelewy24
interface P24TransactionParams {
  sessionId: string;
  amount: number;
  currency: string;
  description: string;
  email: string;
  country: string;
  language: string;
  urlReturn: string;
  urlStatus: string;
  sign: string;
}

interface P24TransactionResponse {
  data: {
    token: string;
  };
}

interface P24VerifyParams {
  merchantId: string;
  posId: string;
  sessionId: string;
  amount: number;
  currency: string;
  orderId: number;
  sign: string;
}

interface P24TransactionStatusResponse {
  data: {
    status: 'success' | 'error';
    orderId?: number;
    sessionId?: string;
  };
}

/**
 * Генерирует подпись для запроса к API Przelewy24
 */
export function generateP24Sign(
  sessionId: string,
  merchantId: string,
  amount: number,
  currency: string,
  crcKey: string
): string {
  const signString = `{"sessionId":"${sessionId}","merchantId":${merchantId},"amount":${amount},"currency":"${currency}","crc":"${crcKey}"}`;
  return createHash('sha384').update(signString).digest('hex');
}

/**
 * Инициализирует транзакцию в Przelewy24
 */
export async function initializeP24Transaction(booking: Booking, baseUrl: string): Promise<string> {
  const sessionId = `BOOKING_${booking.id}`;
  const amount = Math.floor(booking.totalAmount * 100); // конвертируем в гроши (1 PLN = 100 gr)
  
  const sign = generateP24Sign(
    sessionId,
    config.merchantId,
    amount,
    'PLN',
    config.crcKey
  );
  
  const params: P24TransactionParams = {
    sessionId: sessionId,
    amount: amount,
    currency: 'PLN',
    description: `Rezerwacja Smash&Fun - ${booking.packageName}`,
    email: booking.email,
    country: 'PL',
    language: 'pl',
    urlReturn: `${baseUrl}/rezerwacja/potwierdzenie/${booking.id}`,
    urlStatus: `${baseUrl}/api/bookings/payment-webhook`,
    sign: sign,
  };

  try {
    const response = await fetch(`${config.baseUrl}/api/v1/transaction/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${Buffer.from(`${config.posId}:${config.apiKey}`).toString('base64')}`,
      },
      body: JSON.stringify(params),
    });

    const data: P24TransactionResponse = await response.json();
    
    if (!data.data?.token) {
      throw new Error('No token received from Przelewy24');
    }
    
    return `${config.baseUrl}/trnRequest/${data.data.token}`;
  } catch (error) {
    console.error('Error initializing Przelewy24 transaction:', error);
    throw error;
  }
}

/**
 * Проверяет статус транзакции
 */
export async function verifyP24Transaction(
  sessionId: string,
  orderId: number,
  amount: number
): Promise<boolean> {
  const sign = generateP24Sign(
    sessionId,
    config.merchantId,
    amount,
    'PLN',
    config.crcKey
  );
  
  const params: P24VerifyParams = {
    merchantId: config.merchantId,
    posId: config.posId,
    sessionId: sessionId,
    amount: amount,
    currency: 'PLN',
    orderId: orderId,
    sign: sign,
  };

  try {
    const response = await fetch(`${config.baseUrl}/api/v1/transaction/verify`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${Buffer.from(`${config.posId}:${config.apiKey}`).toString('base64')}`,
      },
      body: JSON.stringify(params),
    });

    const data: P24TransactionStatusResponse = await response.json();
    return data.data?.status === 'success';
  } catch (error) {
    console.error('Error verifying Przelewy24 transaction:', error);
    return false;
  }
} 