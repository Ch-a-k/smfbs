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
 * Создает клиент Supabase для использования в клиентских компонентах
 * Эта функция идентична экспортированной переменной supabase,
 * но представлена в виде функции для совместимости со стилем server.ts
 */
export const createClient = () => {
  try {
    return createSupabaseClient<Database>(supabaseUrl || '', supabaseKey || '');
  } catch (error) {
    console.error('Ошибка создания клиента Supabase:', error);
    throw error;
  }
}; 