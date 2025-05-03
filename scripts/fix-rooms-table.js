#!/usr/bin/env node

/**
 * Простой скрипт для обновления таблицы rooms в Supabase
 * Добавляет недостающие колонки
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Ошибка: Не установлены переменные окружения NEXT_PUBLIC_SUPABASE_URL и NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

console.log('Подключение к Supabase по URL:', supabaseUrl);
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
});

async function fixRoomsTable() {
  try {
    // 1. Проверяем существование таблицы rooms
    console.log('Проверка таблицы rooms...');
    
    const { data: rooms, error: roomsError } = await supabase
      .from('rooms')
      .select('id, name, capacity')
      .limit(1);
    
    if (roomsError) {
      throw new Error(`Ошибка доступа к таблице rooms: ${roomsError.message}`);
    }
    
    console.log('Таблица rooms существует, найдено записей:', rooms.length);
    if (rooms.length > 0) {
      console.log('Пример записи:', rooms[0]);
    }
    
    // 2. Получаем информацию о колонках таблицы rooms
    // Поскольку мы не можем напрямую выполнить SQL, попробуем определить структуру таблицы через REST API
    const { data: roomData, error: roomDataError } = await supabase
      .from('rooms')
      .select('*')
      .limit(1)
      .single();
    
    if (roomDataError) {
      console.warn('Предупреждение при получении структуры таблицы:', roomDataError.message);
    } else {
      console.log('Текущие колонки таблицы rooms:', Object.keys(roomData || {}));
    }
    
    // 3. Обновляем существующие записи, добавляя необходимые колонки
    console.log('Обновление записей в таблице rooms...');
    
    // Получаем все записи для обновления
    const { data: allRooms, error: allRoomsError } = await supabase
      .from('rooms')
      .select('id, name, capacity');
    
    if (allRoomsError) {
      throw new Error(`Ошибка получения списка комнат: ${allRoomsError.message}`);
    }
    
    console.log(`Найдено ${allRooms.length} комнат для обновления`);
    
    // Обновляем каждую запись с новыми полями
    for (const room of allRooms) {
      console.log(`Обновление комнаты ID ${room.id}: ${room.name}`);
      
      const { error: updateError } = await supabase
        .from('rooms')
        .update({
          max_people: room.capacity, // Используем значение capacity
          is_active: true,
          work_schedule: {
            monday: { isActive: true, startTime: '09:00', endTime: '22:00' },
            tuesday: { isActive: true, startTime: '09:00', endTime: '22:00' },
            wednesday: { isActive: true, startTime: '09:00', endTime: '22:00' },
            thursday: { isActive: true, startTime: '09:00', endTime: '22:00' },
            friday: { isActive: true, startTime: '09:00', endTime: '22:00' },
            saturday: { isActive: true, startTime: '10:00', endTime: '22:00' },
            sunday: { isActive: true, startTime: '10:00', endTime: '20:00' }
          }
        })
        .eq('id', room.id);
      
      if (updateError) {
        console.warn(`Ошибка обновления комнаты ID ${room.id}:`, updateError.message);
      } else {
        console.log(`Комната ID ${room.id} успешно обновлена`);
      }
    }
    
    console.log('Обновление таблицы rooms завершено');
    
    // 4. Проверяем результат обновления
    const { data: updatedRoom, error: updatedError } = await supabase
      .from('rooms')
      .select('*')
      .order('id')
      .limit(1)
      .single();
    
    if (updatedError) {
      console.warn('Предупреждение при проверке обновления:', updatedError.message);
    } else {
      console.log('Колонки обновленной записи:', Object.keys(updatedRoom));
      console.log('Пример обновленной записи:', JSON.stringify(updatedRoom, null, 2));
    }
    
  } catch (error) {
    console.error('Ошибка при обновлении таблицы rooms:', error.message);
    process.exit(1);
  }
}

// Запускаем обновление
fixRoomsTable()
  .then(() => {
    console.log('Скрипт успешно выполнен');
  })
  .catch(error => {
    console.error('Ошибка выполнения скрипта:', error);
    process.exit(1);
  }); 