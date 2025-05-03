import { NextRequest, NextResponse } from 'next/server';
import { verifyP24Transaction } from '@/lib/przelewy24';
import { createClient } from '@/utils/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { orderId, sessionId, amount, originAmount, currency, method, statement, sign } = data;
    
    // Убираем префикс BOOKING_ из sessionId, чтобы получить ID бронирования
    const bookingId = sessionId.replace('BOOKING_', '');
    
    // Инициализируем клиент Supabase
    const supabase = createClient();
    
    // Получаем бронирование из базы данных
    const { data: booking, error: fetchError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single();
    
    if (fetchError || !booking) {
      console.error('Booking not found:', fetchError);
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }
    
    // Проверяем валидность транзакции
    const isValid = await verifyP24Transaction(sessionId, orderId, amount);
    
    if (!isValid) {
      console.error('Invalid transaction verification');
      return NextResponse.json({ error: 'Invalid transaction' }, { status: 400 });
    }
    
    // Обновляем статус бронирования в базе данных
    const amountInPLN = amount / 100; // Конвертируем из грошей в PLN
    
    const { error: updateError } = await supabase
      .from('bookings')
      .update({
        payment_status: 'FULLY_PAID',
        paid_amount: amountInPLN,
        updated_at: new Date().toISOString()
      })
      .eq('id', bookingId);
    
    if (updateError) {
      console.error('Error updating booking:', updateError);
      return NextResponse.json({ error: 'Failed to update booking' }, { status: 500 });
    }
    
    console.log(`Booking ${bookingId} payment status updated to FULLY_PAID`);
    
    // Отправляем ответ платежной системе
    return NextResponse.json({ status: 'OK' });
    
  } catch (error) {
    console.error('Error processing payment webhook:', error);
    return NextResponse.json({ error: 'Failed to process payment' }, { status: 500 });
  }
} 