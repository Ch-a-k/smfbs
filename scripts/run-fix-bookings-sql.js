#!/usr/bin/env node

/**
 * Скрипт для запуска SQL-скрипта fix-bookings-columns.sql
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Ошибка: Не установлены переменные окружения NEXT_PUBLIC_SUPABASE_URL и NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

console.log('Подключение к Supabase...');
const supabase = createClient(supabaseUrl, supabaseKey);

async function executeSql(sql) {
  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
    
    if (error) {
      console.error('Ошибка выполнения SQL:', error);
      return false;
    }
    
    console.log('SQL-скрипт успешно выполнен:', data);
    return true;
  } catch (error) {
    console.error('Необработанная ошибка выполнения SQL:', error);
    return false;
  }
}

async function setupExecSqlFunction() {
  try {
    // Создаем функцию exec_sql, если она еще не существует
    const createFunctionSql = `
    CREATE OR REPLACE FUNCTION exec_sql(sql_query text)
    RETURNS text
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    BEGIN
      EXECUTE sql_query;
      RETURN 'SQL выполнен успешно';
    EXCEPTION WHEN OTHERS THEN
      RETURN 'Ошибка: ' || SQLERRM;
    END;
    $$;
    `;
    
    // Выполняем запрос напрямую через API Supabase
    console.log('Настройка функции exec_sql...');
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      },
      body: JSON.stringify({ sql_query: createFunctionSql })
    });
    
    if (!response.ok) {
      // Если функция не существует, создаем ее через SQL запрос
      console.log('Функция exec_sql не найдена, создаем...');
      
      // Используем прямой SQL запрос
      const { error } = await supabase.rpc('exec_sql', { sql_query: createFunctionSql });
      
      if (error && !error.message.includes('does not exist')) {
        throw new Error(`Не удалось создать функцию exec_sql: ${error.message}`);
      }
      
      // Пробуем создать функцию через ручной запрос к API
      console.log('Попытка создания функции через SQL запрос...');
      
      // Здесь можно добавить более сложную логику для создания функции
      // Например, через PostgreSQL connection string или другие методы
      
      console.log('ВНИМАНИЕ: Необходимо вручную создать функцию exec_sql в SQL Editor Supabase:');
      console.log(createFunctionSql);
    } else {
      console.log('Функция exec_sql существует и готова к использованию');
      return true;
    }
  } catch (error) {
    console.error('Ошибка настройки функции exec_sql:', error);
    return false;
  }
}

async function runFixBookingsSql() {
  try {
    // Настройка функции exec_sql
    //await setupExecSqlFunction();
    
    // Чтение SQL-скрипта
    const sqlFilePath = path.join(__dirname, 'fix-bookings-columns.sql');
    if (!fs.existsSync(sqlFilePath)) {
      console.error(`Файл скрипта не найден: ${sqlFilePath}`);
      return false;
    }
    
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    console.log('SQL-скрипт загружен, размер:', sqlContent.length, 'байт');
    
    // Разбиваем скрипт на отдельные инструкции
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);
    
    console.log(`Найдено ${statements.length} SQL-инструкций`);
    
    // Выполняем каждую инструкцию отдельно
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`Выполнение инструкции ${i + 1}/${statements.length}...`);
      
      // Используем прямой SQL запрос
      const { data, error } = await supabase.rpc('exec_sql', { sql_query: `${statement};` });
      
      if (error) {
        if (error.message.includes('does not exist') && error.message.includes('exec_sql')) {
          console.error('Функция exec_sql не существует. Необходимо создать ее вручную через SQL Editor в Supabase Dashboard.');
          return false;
        }
        console.error(`Ошибка выполнения инструкции ${i + 1}:`, error);
      } else {
        console.log(`Инструкция ${i + 1} выполнена успешно:`, data);
      }
    }
    
    console.log('Все SQL-инструкции выполнены');
    return true;
  } catch (error) {
    console.error('Ошибка выполнения SQL-скрипта:', error);
    return false;
  }
}

// Запуск скрипта
runFixBookingsSql()
  .then(success => {
    if (success) {
      console.log('Скрипт исправления таблицы bookings выполнен успешно');
      process.exit(0);
    } else {
      console.error('Не удалось выполнить скрипт исправления таблицы bookings');
      
      console.log('\nАЛЬТЕРНАТИВНОЕ РЕШЕНИЕ:');
      console.log('1. Войдите в Supabase Dashboard: https://app.supabase.com');
      console.log('2. Выберите ваш проект');
      console.log('3. Перейдите в раздел "SQL Editor"');
      console.log('4. Создайте новый запрос и вставьте содержимое файла scripts/fix-bookings-columns.sql');
      console.log('5. Выполните запрос');
      
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('Критическая ошибка при выполнении скрипта:', error);
    process.exit(1);
  }); 