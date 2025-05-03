#!/usr/bin/env node

/**
 * Скрипт для обновления структуры базы данных Supabase
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Ошибка: Не установлены переменные окружения NEXT_PUBLIC_SUPABASE_URL и NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Выполняет SQL запрос через Supabase
 * @param {string} sql - SQL запрос для выполнения
 * @returns {Promise<any>} - Результат запроса
 */
async function executeSql(sql) {
  // Используем rpc для выполнения SQL
  const { data, error } = await supabase.rpc('exec_sql', { sql });
  
  if (error) {
    throw new Error(`Ошибка выполнения SQL: ${error.message}`);
  }
  
  return data;
}

/**
 * Проверяет наличие функции exec_sql в базе данных и создает её, если она отсутствует
 */
async function setupExecSqlFunction() {
  try {
    // Проверяем, существует ли функция exec_sql
    const { data: functions, error: functionsError } = await supabase
      .from('pg_catalog.pg_proc')
      .select('proname')
      .eq('proname', 'exec_sql')
      .limit(1);
    
    // Если нет ошибки и найдена функция, значит она уже существует
    if (!functionsError && functions && functions.length > 0) {
      console.log('Функция exec_sql уже существует в базе данных');
      return;
    }
    
    // Если не смогли проверить или функция не существует, пробуем создать её
    console.log('Создаю функцию exec_sql в базе данных...');
    
    // Создаем функцию через REST API, так как у нас нет прямого SQL доступа
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      },
      body: JSON.stringify({
        sql: `
          CREATE OR REPLACE FUNCTION exec_sql(sql text) RETURNS JSONB AS $$
          BEGIN
            EXECUTE sql;
            RETURN '{}'::JSONB;
          EXCEPTION WHEN OTHERS THEN
            RETURN jsonb_build_object('error', SQLERRM);
          END;
          $$ LANGUAGE plpgsql;
        `
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Ошибка создания функции exec_sql: ${errorText}`);
    }
    
    console.log('Функция exec_sql успешно создана');
  } catch (error) {
    console.error('Не удалось создать функцию exec_sql:', error.message);
    console.log('Попробуем обновить базу данных напрямую через REST API');
  }
}

/**
 * Выполняет SQL скрипт для обновления таблицы
 */
async function updateRoomsTable() {
  const sqlFilePath = path.join(__dirname, 'update-rooms-table.sql');
  console.log(`Чтение SQL-скрипта из файла: ${sqlFilePath}`);
  
  try {
    // Проверяем существование колонок через REST API
    const columnsResponse = await fetch(`${supabaseUrl}/rest/v1/rooms?select=id&limit=0`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      }
    });
    
    if (!columnsResponse.ok) {
      throw new Error(`Ошибка проверки таблицы rooms: ${await columnsResponse.text()}`);
    }
    
    // Получаем структуру таблицы
    const tableStructureResponse = await fetch(
      `${supabaseUrl}/rest/v1/?apikey=${supabaseKey}`,
      {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        }
      }
    );
    
    // Продолжаем с добавлением колонок
    console.log('Добавляю недостающие колонки в таблицу rooms...');
    
    // 1. Добавляем is_active, если её нет
    try {
      const addIsActiveResponse = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        },
        body: JSON.stringify({
          sql: `
            DO $$ 
            BEGIN 
              IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'rooms' AND column_name = 'is_active'
              ) THEN 
                ALTER TABLE rooms ADD COLUMN is_active BOOLEAN DEFAULT TRUE; 
              END IF; 
            END $$;
          `
        })
      });
      
      if (!addIsActiveResponse.ok) {
        console.warn('Предупреждение при добавлении колонки is_active:', await addIsActiveResponse.text());
      } else {
        console.log('Колонка is_active успешно проверена/добавлена');
      }
    } catch (error) {
      console.warn('Ошибка при добавлении колонки is_active:', error.message);
    }
    
    // 2. Добавляем max_people, если её нет
    try {
      const addMaxPeopleResponse = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        },
        body: JSON.stringify({
          sql: `
            DO $$ 
            BEGIN 
              IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'rooms' AND column_name = 'max_people'
              ) THEN 
                ALTER TABLE rooms ADD COLUMN max_people INTEGER;
                UPDATE rooms SET max_people = capacity;
                ALTER TABLE rooms ALTER COLUMN max_people SET NOT NULL;
              END IF; 
            END $$;
          `
        })
      });
      
      if (!addMaxPeopleResponse.ok) {
        console.warn('Предупреждение при добавлении колонки max_people:', await addMaxPeopleResponse.text());
      } else {
        console.log('Колонка max_people успешно проверена/добавлена');
      }
    } catch (error) {
      console.warn('Ошибка при добавлении колонки max_people:', error.message);
    }
    
    // 3. Добавляем work_schedule, если её нет
    try {
      const defaultSchedule = JSON.stringify({
        monday: { isActive: true, startTime: '09:00', endTime: '22:00' },
        tuesday: { isActive: true, startTime: '09:00', endTime: '22:00' },
        wednesday: { isActive: true, startTime: '09:00', endTime: '22:00' },
        thursday: { isActive: true, startTime: '09:00', endTime: '22:00' },
        friday: { isActive: true, startTime: '09:00', endTime: '22:00' },
        saturday: { isActive: true, startTime: '10:00', endTime: '22:00' },
        sunday: { isActive: true, startTime: '10:00', endTime: '20:00' }
      });
      
      const addWorkScheduleResponse = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        },
        body: JSON.stringify({
          sql: `
            DO $$ 
            BEGIN 
              IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'rooms' AND column_name = 'work_schedule'
              ) THEN 
                ALTER TABLE rooms ADD COLUMN work_schedule JSONB DEFAULT '${defaultSchedule}'::JSONB;
              END IF; 
            END $$;
          `
        })
      });
      
      if (!addWorkScheduleResponse.ok) {
        console.warn('Предупреждение при добавлении колонки work_schedule:', await addWorkScheduleResponse.text());
      } else {
        console.log('Колонка work_schedule успешно проверена/добавлена');
      }
    } catch (error) {
      console.warn('Ошибка при добавлении колонки work_schedule:', error.message);
    }
    
    console.log('Обновление структуры таблицы rooms завершено');
    
  } catch (error) {
    throw new Error(`Ошибка обновления таблицы rooms: ${error.message}`);
  }
}

/**
 * Основная функция обновления базы данных
 */
async function updateDatabase() {
  console.log('Начинаю обновление структуры базы данных...');
  console.log(`URL: ${supabaseUrl}`);
  
  try {
    // Проверяем существование таблицы rooms
    console.log('Проверяю существование таблицы rooms...');
    
    try {
      const { data: roomsExist, error: roomsError } = await supabase
        .from('rooms')
        .select('id')
        .limit(1);
      
      if (roomsError) {
        console.error('Ошибка при проверке таблицы rooms:', roomsError.message);
        console.log('Возможно, таблица не существует. Сначала запустите скрипт инициализации БД.');
        process.exit(1);
      }
      
      console.log('Таблица rooms существует, продолжаю обновление...');
    } catch (e) {
      console.error('Ошибка при подключении к БД:', e.message);
      process.exit(1);
    }
    
    // Настраиваем и используем функцию для выполнения SQL
    await setupExecSqlFunction();
    
    // Обновляем таблицу rooms
    await updateRoomsTable();
    
    console.log('Структура базы данных успешно обновлена!');
    
    // Проверяем данные в таблице rooms
    console.log('Проверяю данные в таблице rooms:');
    const { data: roomsData, error: roomsDataError } = await supabase
      .from('rooms')
      .select('*');
      
    if (roomsDataError) {
      console.error('Ошибка при получении данных из таблицы rooms:', roomsDataError.message);
    } else {
      console.log(`Количество записей в таблице rooms: ${roomsData.length}`);
      if (roomsData.length > 0) {
        console.log('Пример записи:');
        console.log(JSON.stringify(roomsData[0], null, 2));
      }
    }
    
  } catch (error) {
    console.error('Ошибка при обновлении базы данных:', error.message);
    process.exit(1);
  }
}

// Запускаем обновление
updateDatabase(); 