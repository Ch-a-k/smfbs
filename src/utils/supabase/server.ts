import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/database.types';

/**
 * Создает клиент Supabase для использования в серверных компонентах и API routes
 * @returns Клиент Supabase
 */
export const createClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  // Диагностическая информация о переменных окружения (только для отладки)
  console.log('Проверка переменных окружения Supabase:', {
    hasUrl: !!supabaseUrl,
    hasKey: !!supabaseKey,
    urlLength: supabaseUrl?.length || 0,
    keyLength: supabaseKey?.length || 0,
    nodeEnv: process.env.NODE_ENV || 'unknown'
  });
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('Ошибка: Не установлены переменные окружения NEXT_PUBLIC_SUPABASE_URL и NEXT_PUBLIC_SUPABASE_ANON_KEY');
    // Для отладки проверяем все доступные переменные окружения, чтобы убедиться, что они загружаются
    const envVarList = Object.keys(process.env)
      .filter(key => !key.includes('KEY') && !key.includes('SECRET')) // Не выводим секретные ключи
      .join(', ');
    
    console.error('Доступные переменные окружения:', envVarList);
  }
  
  // В продакшн режиме не выводим URL для безопасности
  if (process.env.NODE_ENV === 'development') {
    console.log('Creating Supabase server client with URL length:', supabaseUrl?.length || 0);
  }
  
  try {
    const client = createSupabaseClient<Database>(supabaseUrl || '', supabaseKey || '');
    console.log('Supabase client created successfully!');
    return client;
  } catch (error) {
    console.error('Ошибка создания клиента Supabase:', error);
    throw error;
  }
}; 