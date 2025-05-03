#!/usr/bin/env node

/**
 * Скрипт для инициализации базы данных Supabase
 * 
 * Этот скрипт создает необходимые таблицы в базе данных Supabase для работы приложения:
 * - rooms (комнаты)
 * - packages (пакеты услуг)
 * - bookings (бронирования)
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Ошибка: Не установлены переменные окружения NEXT_PUBLIC_SUPABASE_URL и NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function initializeDatabase() {
  console.log('Начинаю инициализацию базы данных...');
  
  try {
    // Создаем таблицу rooms (комнаты), если она не существует
    const { error: roomsError } = await supabase.rpc('create_rooms_table_if_not_exists');
    
    if (roomsError) {
      // Если RPC функция не существует, создаем таблицу напрямую
      console.log('Создаю таблицу rooms вручную...');
      
      const { error } = await supabase.from('rooms').select('count').limit(1).throwOnError();
      
      // Если таблица не существует, создаем ее
      if (error && error.code === '42P01') { // код ошибки для "relation does not exist"
        console.log('Таблица rooms не существует, создаю...');
        
        // SQL для создания таблицы rooms
        const { error: createError } = await supabase.query(`
          CREATE TABLE rooms (
            id SERIAL PRIMARY KEY,
            name TEXT NOT NULL,
            capacity INTEGER NOT NULL,
            max_people INTEGER NOT NULL,
            is_active BOOLEAN DEFAULT true,
            available BOOLEAN DEFAULT true,
            work_schedule JSONB DEFAULT '${JSON.stringify({
              monday: { isActive: true, startTime: '09:00', endTime: '22:00' },
              tuesday: { isActive: true, startTime: '09:00', endTime: '22:00' },
              wednesday: { isActive: true, startTime: '09:00', endTime: '22:00' },
              thursday: { isActive: true, startTime: '09:00', endTime: '22:00' },
              friday: { isActive: true, startTime: '09:00', endTime: '22:00' },
              saturday: { isActive: true, startTime: '10:00', endTime: '22:00' },
              sunday: { isActive: true, startTime: '10:00', endTime: '20:00' }
            })}'::jsonb
          );
        `);
        
        if (createError) {
          throw new Error(`Ошибка создания таблицы rooms: ${createError.message}`);
        }
        
        console.log('Таблица rooms успешно создана');
        
        // Добавляем тестовые данные
        const { error: insertError } = await supabase
          .from('rooms')
          .insert([
            { name: 'Pokój 1', capacity: 10, max_people: 12, is_active: true },
            { name: 'Pokój 2', capacity: 8, max_people: 10, is_active: true },
            { name: 'Pokój VIP', capacity: 6, max_people: 8, is_active: true }
          ]);
        
        if (insertError) {
          throw new Error(`Ошибка добавления тестовых данных в rooms: ${insertError.message}`);
        }
        
        console.log('Тестовые данные для rooms добавлены');
      } else if (error) {
        throw new Error(`Ошибка при проверке таблицы rooms: ${error.message}`);
      } else {
        console.log('Таблица rooms уже существует');
      }
    } else {
      console.log('Таблица rooms создана через RPC');
    }
    
    // Создаем таблицу packages (пакеты услуг), если она не существует
    const { error: packagesError } = await supabase.from('packages').select('count').limit(1).throwOnError();
    
    // Если таблица не существует, создаем ее
    if (packagesError && packagesError.code === '42P01') {
      console.log('Таблица packages не существует, создаю...');
      
      // SQL для создания таблицы packages
      const { error: createError } = await supabase.query(`
        CREATE TABLE packages (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          description TEXT,
          price NUMERIC(10, 2) NOT NULL,
          duration INTEGER NOT NULL,
          is_active BOOLEAN DEFAULT true
        );
      `);
      
      if (createError) {
        throw new Error(`Ошибка создания таблицы packages: ${createError.message}`);
      }
      
      console.log('Таблица packages успешно создана');
      
      // Добавляем тестовые данные
      const { error: insertError } = await supabase
        .from('packages')
        .insert([
          { name: 'Standardowy', description: 'Standardowy pakiet', price: 150.00, duration: 60, is_active: true },
          { name: 'Premium', description: 'Pakiet premium', price: 250.00, duration: 120, is_active: true },
          { name: 'VIP', description: 'Pakiet VIP', price: 400.00, duration: 180, is_active: true }
        ]);
      
      if (insertError) {
        throw new Error(`Ошибка добавления тестовых данных в packages: ${insertError.message}`);
      }
      
      console.log('Тестовые данные для packages добавлены');
    } else if (packagesError) {
      throw new Error(`Ошибка при проверке таблицы packages: ${packagesError.message}`);
    } else {
      console.log('Таблица packages уже существует');
    }
    
    // Создаем таблицу bookings (бронирования), если она не существует
    const { error: bookingsError } = await supabase.from('bookings').select('count').limit(1).throwOnError();
    
    // Если таблица не существует, создаем ее
    if (bookingsError && bookingsError.code === '42P01') {
      console.log('Таблица bookings не существует, создаю...');
      
      // SQL для создания таблицы bookings
      const { error: createError } = await supabase.query(`
        CREATE TABLE bookings (
          id SERIAL PRIMARY KEY,
          room_id INTEGER NOT NULL REFERENCES rooms(id),
          package_id INTEGER NOT NULL REFERENCES packages(id),
          customer_name TEXT NOT NULL,
          customer_email TEXT NOT NULL,
          customer_phone TEXT NOT NULL,
          booking_date DATE NOT NULL,
          start_time TIME NOT NULL,
          end_time TIME NOT NULL,
          num_people INTEGER NOT NULL,
          status TEXT DEFAULT 'pending',
          total_price NUMERIC(10, 2) NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
          notes TEXT,
          promo_code TEXT
        );
      `);
      
      if (createError) {
        throw new Error(`Ошибка создания таблицы bookings: ${createError.message}`);
      }
      
      console.log('Таблица bookings успешно создана');
      
      // Создаем индексы для быстрого поиска
      const { error: indexError } = await supabase.query(`
        CREATE INDEX bookings_room_id_idx ON bookings(room_id);
        CREATE INDEX bookings_package_id_idx ON bookings(package_id);
        CREATE INDEX bookings_booking_date_idx ON bookings(booking_date);
        CREATE INDEX bookings_status_idx ON bookings(status);
      `);
      
      if (indexError) {
        throw new Error(`Ошибка создания индексов для bookings: ${indexError.message}`);
      }
      
      console.log('Индексы для bookings созданы');
    } else if (bookingsError) {
      throw new Error(`Ошибка при проверке таблицы bookings: ${bookingsError.message}`);
    } else {
      console.log('Таблица bookings уже существует');
    }
    
    console.log('Инициализация базы данных успешно завершена');
  } catch (error) {
    console.error('Ошибка при инициализации базы данных:', error);
    process.exit(1);
  }
}

// Запускаем инициализацию
initializeDatabase(); 