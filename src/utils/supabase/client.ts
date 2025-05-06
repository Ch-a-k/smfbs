import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/database.types';

/**
 * Клиент Supabase для использования в клиентских компонентах
 * Используйте эту версию для компонентов на стороне клиента
 */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Ошибка: Не установлены переменные окружения NEXT_PUBLIC_SUPABASE_URL и NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

export const supabase = createSupabaseClient<Database>(supabaseUrl || '', supabaseKey || '');

/**
 * Создает клиент Supabase для использования на клиентской стороне
 * @returns Клиент Supabase
 */
export const createClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  // Диагностическая информация о переменных окружения на клиенте
  console.log('Клиент: Проверка переменных окружения Supabase:', {
    hasUrl: !!supabaseUrl,
    hasKey: !!supabaseKey,
    urlLength: supabaseUrl?.length || 0,
    keyLength: supabaseKey?.length || 0,
  });
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('Клиент: Ошибка! Не установлены переменные окружения NEXT_PUBLIC_SUPABASE_URL и NEXT_PUBLIC_SUPABASE_ANON_KEY');
    // Проверяем все доступные публичные переменные окружения
    const publicEnvVars = Object.keys(process.env)
      .filter(key => key.startsWith('NEXT_PUBLIC_'))
      .join(', ');
    
    console.error('Клиент: Доступные публичные переменные окружения:', publicEnvVars);
  }
  
  try {
    const client = createSupabaseClient<Database>(supabaseUrl || '', supabaseKey || '');
    console.log('Клиент: Supabase client создан успешно!');
    return client;
  } catch (error) {
    console.error('Клиент: Ошибка создания клиента Supabase:', error);
    throw error;
  }
}; 