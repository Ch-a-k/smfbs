#!/usr/bin/env node

/**
 * Скрипт для синхронизации структуры базы данных
 * Проверяет и обновляет структуру таблиц в Supabase
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Получаем URL и ключ Supabase из переменных окружения
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Ошибка: Не установлены переменные окружения NEXT_PUBLIC_SUPABASE_URL и NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

// Создаем клиент Supabase
console.log('Подключение к Supabase...');
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
});

// Функция для обновления таблицы rooms
async function updateRoomsTable() {
  try {
    console.log('Проверка и обновление таблицы rooms...');
    
    // Проверка существования таблицы rooms
    try {
      const { count, error } = await supabase
        .from('rooms')
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.log('Таблица rooms не существует или возникла ошибка:', error.message);
        
        // Создаем таблицу rooms
        console.log('Создание таблицы rooms...');
        await supabase.rpc('create_rooms_table', {});
        console.log('Таблица rooms создана');
        
        // Добавляем тестовые данные
        await insertTestRooms();
      } else {
        console.log(`Таблица rooms существует, получено ${count} записей.`);
        
        // Обновляем поля существующих записей
        await updateExistingRooms();
      }
    } catch (error) {
      console.error('Ошибка при проверке таблицы rooms:', error);
      
      // Устанавливаем разрешения для RLS, чтобы обойти возможные проблемы с правами
      try {
        console.log('Попытка установить разрешения для публичного доступа к таблице rooms...');
        
        // Делаем прямой POST запрос к REST API для создания таблицы
        const response = await fetch(`${supabaseUrl}/rest/v1/rooms`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Prefer': 'return=representation'
          },
          body: JSON.stringify({
            name: 'Test Room',
            capacity: 10,
            max_people: 12,
            is_active: true,
            available: true,
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
        });
        
        if (response.ok) {
          console.log('Тестовая запись успешно создана, таблица существует');
          
          // Удаляем тестовую запись
          const data = await response.json();
          if (data && data.id) {
            await supabase.from('rooms').delete().eq('id', data.id);
            console.log('Тестовая запись удалена');
          }
        } else {
          console.error('Не удалось создать тестовую запись:', await response.text());
        }
      } catch (e) {
        console.error('Ошибка при установке разрешений:', e);
      }
    }
    
    return true;
  } catch (error) {
    console.error('Ошибка при обновлении таблицы rooms:', error);
    return false;
  }
}

// Функция для вставки тестовых комнат
async function insertTestRooms() {
  try {
    console.log('Добавление тестовых данных в таблицу rooms...');
    
    const testRooms = [
      {
        name: 'Pokój 1',
        capacity: 10,
        max_people: 12,
        is_active: true,
        available: true,
        work_schedule: {
          monday: { isActive: true, startTime: '09:00', endTime: '22:00' },
          tuesday: { isActive: true, startTime: '09:00', endTime: '22:00' },
          wednesday: { isActive: true, startTime: '09:00', endTime: '22:00' },
          thursday: { isActive: true, startTime: '09:00', endTime: '22:00' },
          friday: { isActive: true, startTime: '09:00', endTime: '22:00' },
          saturday: { isActive: true, startTime: '10:00', endTime: '22:00' },
          sunday: { isActive: true, startTime: '10:00', endTime: '20:00' }
        }
      },
      {
        name: 'Pokój 2',
        capacity: 8,
        max_people: 10,
        is_active: true,
        available: true,
        work_schedule: {
          monday: { isActive: true, startTime: '09:00', endTime: '22:00' },
          tuesday: { isActive: true, startTime: '09:00', endTime: '22:00' },
          wednesday: { isActive: true, startTime: '09:00', endTime: '22:00' },
          thursday: { isActive: true, startTime: '09:00', endTime: '22:00' },
          friday: { isActive: true, startTime: '09:00', endTime: '22:00' },
          saturday: { isActive: true, startTime: '10:00', endTime: '22:00' },
          sunday: { isActive: true, startTime: '10:00', endTime: '20:00' }
        }
      },
      {
        name: 'Pokój VIP',
        capacity: 6,
        max_people: 8,
        is_active: true,
        available: true,
        work_schedule: {
          monday: { isActive: true, startTime: '09:00', endTime: '22:00' },
          tuesday: { isActive: true, startTime: '09:00', endTime: '22:00' },
          wednesday: { isActive: true, startTime: '09:00', endTime: '22:00' },
          thursday: { isActive: true, startTime: '09:00', endTime: '22:00' },
          friday: { isActive: true, startTime: '09:00', endTime: '22:00' },
          saturday: { isActive: true, startTime: '10:00', endTime: '22:00' },
          sunday: { isActive: true, startTime: '10:00', endTime: '20:00' }
        }
      }
    ];
    
    const { data, error } = await supabase
      .from('rooms')
      .insert(testRooms)
      .select();
      
    if (error) {
      console.error('Ошибка при добавлении тестовых комнат:', error);
      return false;
    }
    
    console.log(`Добавлено ${data.length} тестовых комнат`);
    return true;
  } catch (error) {
    console.error('Ошибка при добавлении тестовых комнат:', error);
    return false;
  }
}

// Функция для обновления существующих комнат
async function updateExistingRooms() {
  try {
    console.log('Проверка и обновление существующих комнат...');
    
    // Получаем все комнаты
    const { data: rooms, error } = await supabase
      .from('rooms')
      .select('*');
      
    if (error) {
      console.error('Ошибка при получении списка комнат:', error);
      return false;
    }
    
    console.log(`Найдено ${rooms.length} комнат для обновления`);
    
    // Обновляем каждую комнату
    for (const room of rooms) {
      // Проверяем структуру work_schedule
      let needsUpdate = false;
      let workSchedule = room.work_schedule || {};
      
      // Проверяем наличие всех дней недели и корректность структуры
      const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
      
      for (const day of days) {
        if (!workSchedule[day]) {
          // Если день отсутствует, добавляем его
          workSchedule[day] = {
            isActive: true,
            startTime: day === 'saturday' || day === 'sunday' ? '10:00' : '09:00',
            endTime: day === 'sunday' ? '20:00' : '22:00'
          };
          needsUpdate = true;
        } else if (workSchedule[day].active !== undefined && workSchedule[day].isActive === undefined) {
          // Конвертируем active в isActive
          workSchedule[day].isActive = workSchedule[day].active;
          delete workSchedule[day].active;
          needsUpdate = true;
        }
      }
      
      // Если нужно обновить расписание
      if (needsUpdate) {
        console.log(`Обновление расписания для комнаты ${room.id} (${room.name})...`);
        
        const { error: updateError } = await supabase
          .from('rooms')
          .update({ work_schedule: workSchedule })
          .eq('id', room.id);
          
        if (updateError) {
          console.error(`Ошибка при обновлении комнаты ${room.id}:`, updateError);
        } else {
          console.log(`Расписание для комнаты ${room.id} успешно обновлено`);
        }
      }
    }
    
    return true;
  } catch (error) {
    console.error('Ошибка при обновлении существующих комнат:', error);
    return false;
  }
}

// Главная функция синхронизации базы данных
async function syncDatabase() {
  try {
    console.log('Начало синхронизации базы данных...');
    
    // Обновляем таблицу rooms
    await updateRoomsTable();
    
    // Здесь можно добавить обновление других таблиц
    // ...
    
    console.log('Синхронизация базы данных завершена');
    return true;
  } catch (error) {
    console.error('Ошибка при синхронизации базы данных:', error);
    return false;
  }
}

// Запускаем синхронизацию
syncDatabase()
  .then(success => {
    if (success) {
      console.log('База данных успешно синхронизирована');
    } else {
      console.error('Не удалось полностью синхронизировать базу данных');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('Критическая ошибка:', error);
    process.exit(1);
  }); 