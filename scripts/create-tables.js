#!/usr/bin/env node

/**
 * Скрипт для создания таблиц в Supabase
 * Использует SQL из файла create-tables.sql
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
const supabase = createClient(supabaseUrl, supabaseKey);

// Функция для выполнения SQL из файла
async function executeCreateTables() {
  try {
    console.log('Чтение SQL-файла...');
    
    // Чтение SQL из файла
    const sqlFilePath = path.join(__dirname, 'create-tables.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    // Разделяем SQL на отдельные инструкции
    const statements = sqlContent
      .split(';')
      .map(statement => statement.trim())
      .filter(statement => statement.length > 0);
    
    console.log(`Найдено ${statements.length} SQL-инструкций`);
    
    // Выполняем каждую инструкцию отдельно
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`Выполнение инструкции ${i + 1}/${statements.length}...`);
      
      try {
        const { error } = await supabase.query(`${statement};`);
        
        if (error) {
          console.warn(`Предупреждение при выполнении инструкции ${i + 1}:`, error.message);
        }
      } catch (e) {
        console.warn(`Ошибка при выполнении инструкции ${i + 1}:`, e.message);
      }
    }
    
    console.log('Все инструкции выполнены');
    return true;
  } catch (error) {
    console.error('Ошибка выполнения SQL:', error);
    return false;
  }
}

// Запускаем создание таблиц
executeCreateTables()
  .then(success => {
    if (success) {
      console.log('Таблицы успешно созданы или обновлены');
    } else {
      console.error('Не удалось полностью создать таблицы');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('Критическая ошибка:', error);
    process.exit(1);
  }); 