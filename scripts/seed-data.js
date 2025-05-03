// Скрипт для инициализации базы данных Supabase
// Запускать командой: node scripts/seed-data.js

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Переменные окружения NEXT_PUBLIC_SUPABASE_URL и NEXT_PUBLIC_SUPABASE_ANON_KEY должны быть установлены');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Пример данных о комнатах
const rooms = [
  { name: 'Комната 1', capacity: 2, max_people: 2, available: true, is_active: true, work_schedule: getDefaultWorkSchedule() },
  { name: 'Комната 2', capacity: 2, max_people: 3, available: true, is_active: true, work_schedule: getDefaultWorkSchedule() },
  { name: 'Комната 3', capacity: 4, max_people: 6, available: true, is_active: true, work_schedule: getDefaultWorkSchedule() },
  { name: 'Комната 4', capacity: 6, max_people: 8, available: true, is_active: true, work_schedule: getDefaultWorkSchedule() },
];

// Пример данных о пакетах
const packages = [
  { 
    id: 'bulka', 
    name: 'BUŁKA Z MASŁEM', 
    description: 'Легкий пакет', 
    price: 199, 
    deposit_amount: 50, 
    duration: 30, 
    max_people: 2,
    preferred_rooms: [1, 2, 3]
  },
  { 
    id: 'latwy', 
    name: 'ŁATWY', 
    description: 'Простой пакет', 
    price: 299, 
    deposit_amount: 75, 
    duration: 45, 
    max_people: 2,
    preferred_rooms: [1, 2, 3]
  },
  { 
    id: 'sredni', 
    name: 'ŚREDNI', 
    description: 'Средний пакет', 
    price: 499, 
    deposit_amount: 100, 
    duration: 120, 
    max_people: 4,
    preferred_rooms: [1, 2, 3]
  },
  { 
    id: 'trudny', 
    name: 'TRUDNY', 
    description: 'Сложный пакет', 
    price: 999, 
    deposit_amount: 200, 
    duration: 180, 
    max_people: 6,
    preferred_rooms: [4]
  }
];

// Пример промокодов
const promoCodes = [
  { code: 'HAPPYHOURS', discount_percent: 20 }
];

// Функция для создания расписания по умолчанию
function getDefaultWorkSchedule() {
  return {
    monday: { isActive: true, startTime: '09:00', endTime: '22:00' },
    tuesday: { isActive: true, startTime: '09:00', endTime: '22:00' },
    wednesday: { isActive: true, startTime: '09:00', endTime: '22:00' },
    thursday: { isActive: true, startTime: '09:00', endTime: '22:00' },
    friday: { isActive: true, startTime: '09:00', endTime: '22:00' },
    saturday: { isActive: true, startTime: '10:00', endTime: '22:00' },
    sunday: { isActive: true, startTime: '10:00', endTime: '20:00' }
  };
}

async function seedDatabase() {
  console.log('Начало инициализации базы данных...');
  
  try {
    // Проверяем существование таблиц
    console.log('Проверка существования таблиц...');
    
    // Получаем список таблиц
    const { data: tablesData, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public');
    
    if (tablesError) {
      console.log('Не удалось получить список таблиц, пытаемся создать заново...');
    } else {
      const existingTables = tablesData.map(t => t.table_name);
      console.log('Существующие таблицы:', existingTables);
    }
    
    // Очищаем таблицы перед вставкой данных
    console.log('Очистка данных...');
    
    try {
      // Используем более безопасный способ очистки таблиц
      await supabase.from('bookings').delete().is('id', 'is.not', null);
      console.log('Таблица bookings очищена');
    } catch (error) {
      console.log('Ошибка при очистке bookings (возможно, таблица не существует):', error.message);
    }
    
    try {
      await supabase.from('promo_codes').delete().is('code', 'is.not', null);
      console.log('Таблица promo_codes очищена');
    } catch (error) {
      console.log('Ошибка при очистке promo_codes (возможно, таблица не существует):', error.message);
    }
    
    try {
      await supabase.from('packages').delete().is('id', 'is.not', null);
      console.log('Таблица packages очищена');
    } catch (error) {
      console.log('Ошибка при очистке packages (возможно, таблица не существует):', error.message);
    }
    
    try {
      await supabase.from('rooms').delete().is('id', 'is.not', null);
      console.log('Таблица rooms очищена');
    } catch (error) {
      console.log('Ошибка при очистке rooms (возможно, таблица не существует):', error.message);
    }
    
    console.log('Таблицы очищены');
    
    // Вставляем комнаты
    console.log('Вставка комнат...');
    try {
      const { error: roomsError } = await supabase.from('rooms').insert(rooms);
      if (roomsError) {
        console.error(`Ошибка при вставке комнат: ${roomsError.message}`);
        console.log('Пробуем вставлять комнаты по одной...');
        
        for (const room of rooms) {
          const { error } = await supabase.from('rooms').insert([room]);
          if (error) {
            console.error(`Не удалось вставить комнату "${room.name}": ${error.message}`);
          } else {
            console.log(`Комната "${room.name}" успешно добавлена`);
          }
        }
      } else {
        console.log('Комнаты успешно добавлены');
      }
    } catch (e) {
      console.error(`Исключение при вставке комнат: ${e.message}`);
    }
    
    // Вставляем пакеты
    console.log('Вставка пакетов...');
    try {
      const { error: packagesError } = await supabase.from('packages').insert(packages);
      if (packagesError) {
        console.error(`Ошибка при вставке пакетов: ${packagesError.message}`);
        console.log('Пробуем вставлять пакеты по одному...');
        
        for (const pkg of packages) {
          const { error } = await supabase.from('packages').insert([pkg]);
          if (error) {
            console.error(`Не удалось вставить пакет "${pkg.name}": ${error.message}`);
          } else {
            console.log(`Пакет "${pkg.name}" успешно добавлен`);
          }
        }
      } else {
        console.log('Пакеты успешно добавлены');
      }
    } catch (e) {
      console.error(`Исключение при вставке пакетов: ${e.message}`);
    }
    
    // Вставляем промокоды
    console.log('Вставка промокодов...');
    try {
      const { error: promoCodesError } = await supabase.from('promo_codes').insert(promoCodes);
      if (promoCodesError) {
        console.error(`Ошибка при вставке промокодов: ${promoCodesError.message}`);
        console.log('Пробуем вставлять промокоды по одному...');
        
        for (const promo of promoCodes) {
          const { error } = await supabase.from('promo_codes').insert([promo]);
          if (error) {
            console.error(`Не удалось вставить промокод "${promo.code}": ${error.message}`);
          } else {
            console.log(`Промокод "${promo.code}" успешно добавлен`);
          }
        }
      } else {
        console.log('Промокоды успешно добавлены');
      }
    } catch (e) {
      console.error(`Исключение при вставке промокодов: ${e.message}`);
    }
    
    console.log('База данных успешно инициализирована!');
  } catch (error) {
    console.error('Ошибка при инициализации базы данных:', error.message);
    process.exit(1);
  }
}

seedDatabase(); 