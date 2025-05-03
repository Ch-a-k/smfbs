-- Скрипт для обновления таблицы packages в Supabase
-- Добавляет недостающие колонки в таблицу packages

-- Проверка существования колонки deposit_amount
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'packages'
    AND column_name = 'deposit_amount'
  ) THEN
    ALTER TABLE packages ADD COLUMN deposit_amount NUMERIC(10, 2);
    
    -- Установим значение по умолчанию как 30% от цены
    UPDATE packages SET deposit_amount = ROUND(price * 0.3);
    
    RAISE NOTICE 'Колонка deposit_amount добавлена и заполнена значениями';
  ELSE
    RAISE NOTICE 'Колонка deposit_amount уже существует';
  END IF;
END $$;

-- Проверка существования колонки max_people
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'packages'
    AND column_name = 'max_people'
  ) THEN
    ALTER TABLE packages ADD COLUMN max_people INTEGER DEFAULT 6;
    RAISE NOTICE 'Колонка max_people добавлена со значением по умолчанию 6';
  ELSE
    RAISE NOTICE 'Колонка max_people уже существует';
  END IF;
END $$;

-- Проверка существования колонки preferred_rooms
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'packages'
    AND column_name = 'preferred_rooms'
  ) THEN
    ALTER TABLE packages ADD COLUMN preferred_rooms JSONB DEFAULT '[]'::jsonb;
    RAISE NOTICE 'Колонка preferred_rooms добавлена с пустым массивом по умолчанию';
  ELSE
    RAISE NOTICE 'Колонка preferred_rooms уже существует';
  END IF;
END $$;

-- Добавляем тестовые данные в preferred_rooms, если массив пустой
UPDATE packages 
SET preferred_rooms = '[1,2,3]'::jsonb 
WHERE (preferred_rooms IS NULL OR preferred_rooms = '[]'::jsonb) AND id = 1;

UPDATE packages 
SET preferred_rooms = '[1,3]'::jsonb 
WHERE (preferred_rooms IS NULL OR preferred_rooms = '[]'::jsonb) AND id = 2;

UPDATE packages 
SET preferred_rooms = '[2,3]'::jsonb 
WHERE (preferred_rooms IS NULL OR preferred_rooms = '[]'::jsonb) AND id = 3;

-- Вывод тестовых записей для проверки
SELECT id, name, price, deposit_amount, duration, max_people, preferred_rooms, is_active 
FROM packages 
ORDER BY id 
LIMIT 5; 