import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/database.types';

/**
 * Создает клиент Supabase для использования в серверных компонентах и API routes
 * @returns Клиент Supabase
 */
export const createClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('Ошибка: Не установлены переменные окружения NEXT_PUBLIC_SUPABASE_URL и NEXT_PUBLIC_SUPABASE_ANON_KEY');
  }
  
  // В продакшн режиме не выводим URL для безопасности
  if (process.env.NODE_ENV === 'development') {
    console.log('Creating Supabase server client');
  }
  
  try {
    return createSupabaseClient<Database>(supabaseUrl || '', supabaseKey || '');
  } catch (error) {
    console.error('Ошибка создания клиента Supabase:', error);
    throw error;
  }
}; 