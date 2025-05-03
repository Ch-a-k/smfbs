#!/usr/bin/env node

/**
 * Скрипт для проверки и обновления структуры таблицы bookings
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Ошибка: Не установлены переменные окружения NEXT_PUBLIC_SUPABASE_URL и NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

console.log('Подключение к Supabase...');
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkBookingsTable() {
  try {
    console.log('Проверка структуры таблицы bookings...');
    
    // Проверяем наличие таблицы bookings
    const { data: tableExists, error: tableError } = await supabase
      .from('bookings')
      .select('id')
      .limit(1);
    
    if (tableError) {
      if (tableError.code === 'PGRST116') {
        console.error('Таблица bookings не существует! Необходимо выполнить скрипт create-tables.sql');
        return false;
      }
      throw tableError;
    }
    
    console.log('Таблица bookings существует.');
    
    // Проверяем структуру таблицы с помощью метаданных
    console.log('Создание тестового бронирования для проверки структуры...');
    
    // Получаем текущие данные из rooms и packages для создания тестового бронирования
    const { data: rooms, error: roomsError } = await supabase
      .from('rooms')
      .select('id')
      .limit(1);
    
    if (roomsError || !rooms || rooms.length === 0) {
      console.error('Не удалось получить комнаты для тестового бронирования:', roomsError);
      return false;
    }
    
    const { data: packages, error: packagesError } = await supabase
      .from('packages')
      .select('id')
      .limit(1);
    
    if (packagesError || !packages || packages.length === 0) {
      console.error('Не удалось получить пакеты для тестового бронирования:', packagesError);
      return false;
    }
    
    const testBookingData = {
      room_id: rooms[0].id,
      package_id: packages[0].id,
      package_name: 'Test Package',
      customer_name: 'Test Customer',
      customer_email: 'test@example.com',
      customer_phone: '123456789',
      booking_date: new Date().toISOString().split('T')[0],
      start_time: '10:00',
      end_time: '12:00',
      num_people: 2,
      total_price: 100,
      paid_amount: 0,
      payment_status: 'UNPAID',
      status: 'pending',
      notes: 'Test booking',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    // Попытка создать тестовое бронирование
    const { data: testBooking, error: insertError } = await supabase
      .from('bookings')
      .insert([testBookingData])
      .select();
    
    if (insertError) {
      console.error('Ошибка при создании тестового бронирования:', insertError);
      console.log('Пытаемся определить, какие колонки отсутствуют...');
      
      // Проверяем наличие ключевых колонок
      if (insertError.message.includes('booking_date')) {
        console.error('КРИТИЧЕСКАЯ ОШИБКА: Отсутствует колонка booking_date');
        console.log('Выполните следующий SQL запрос в Supabase SQL Editor:');
        console.log('ALTER TABLE bookings ADD COLUMN IF NOT EXISTS booking_date DATE;');
      }
      
      if (insertError.message.includes('package_name')) {
        console.error('КРИТИЧЕСКАЯ ОШИБКА: Отсутствует колонка package_name');
        console.log('Выполните следующий SQL запрос в Supabase SQL Editor:');
        console.log('ALTER TABLE bookings ADD COLUMN IF NOT EXISTS package_name TEXT;');
      }
      
      return false;
    }
    
    console.log('Тестовое бронирование успешно создано!');
    
    // Удаляем тестовое бронирование
    const { error: deleteError } = await supabase
      .from('bookings')
      .delete()
      .eq('id', testBooking[0].id);
    
    if (deleteError) {
      console.warn('Не удалось удалить тестовое бронирование:', deleteError);
    } else {
      console.log('Тестовое бронирование успешно удалено.');
    }
    
    console.log('Структура таблицы bookings проверена, все необходимые колонки присутствуют.');
    return true;
  } catch (error) {
    console.error('Ошибка при проверке таблицы bookings:', error);
    return false;
  }
}

async function fixDateColumn() {
  try {
    console.log('Проверка и исправление колонки booking_date...');
    
    // Проверяем существующие записи
    const { data: bookings, error: fetchError } = await supabase
      .from('bookings')
      .select('id, created_at')
      .is('booking_date', null);
    
    if (fetchError) {
      console.error('Ошибка при получении бронирований с отсутствующей датой:', fetchError);
      return false;
    }
    
    if (bookings && bookings.length > 0) {
      console.log(`Найдено ${bookings.length} бронирований с отсутствующей датой.`);
      
      for (const booking of bookings) {
        const bookingDate = booking.created_at ? new Date(booking.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
        
        const { error: updateError } = await supabase
          .from('bookings')
          .update({ booking_date: bookingDate })
          .eq('id', booking.id);
        
        if (updateError) {
          console.error(`Ошибка при обновлении даты для бронирования ${booking.id}:`, updateError);
        } else {
          console.log(`Обновлена дата для бронирования ${booking.id}: ${bookingDate}`);
        }
      }
    } else {
      console.log('Все бронирования имеют корректные даты.');
    }
    
    return true;
  } catch (error) {
    console.error('Ошибка при исправлении колонки booking_date:', error);
    return false;
  }
}

// Выполняем проверку и исправление
async function runFixes() {
  try {
    const isTableValid = await checkBookingsTable();
    
    if (isTableValid) {
      await fixDateColumn();
      console.log('Проверка и исправление таблицы bookings завершены успешно!');
    } else {
      console.error('Не удалось исправить таблицу bookings. Необходимо ручное вмешательство.');
    }
  } catch (error) {
    console.error('Ошибка при выполнении исправлений:', error);
  }
}

runFixes(); 