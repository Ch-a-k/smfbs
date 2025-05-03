-- Скрипт для добавления отсутствующих колонок в таблицу bookings
-- Этот скрипт безопасно добавляет колонки, только если они не существуют

-- Добавляем колонку booking_date, если она отсутствует
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'bookings'
    AND column_name = 'booking_date'
  ) THEN
    ALTER TABLE bookings ADD COLUMN booking_date DATE;
    RAISE NOTICE 'Колонка booking_date добавлена';
  ELSE
    RAISE NOTICE 'Колонка booking_date уже существует';
  END IF;
END $$;

-- Добавляем колонку package_name, если она отсутствует
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'bookings'
    AND column_name = 'package_name'
  ) THEN
    ALTER TABLE bookings ADD COLUMN package_name TEXT;
    RAISE NOTICE 'Колонка package_name добавлена';
  ELSE
    RAISE NOTICE 'Колонка package_name уже существует';
  END IF;
END $$;

-- Обновляем booking_date на основе данных created_at для записей, где booking_date не установлен
UPDATE bookings 
SET booking_date = created_at::date
WHERE booking_date IS NULL AND created_at IS NOT NULL;

-- Обновляем package_name на основе package_id для записей, где package_name не установлен
UPDATE bookings AS b
SET package_name = p.name
FROM packages AS p
WHERE b.package_id = p.id AND b.package_name IS NULL;

-- Проверка и фиксация ошибок в формате времени
DO $$
BEGIN
  -- Если колонка start_time имеет тип TIMESTAMP, конвертируем в TIME
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'bookings'
    AND column_name = 'start_time'
    AND data_type LIKE '%timestamp%'
  ) THEN
    ALTER TABLE bookings 
    ALTER COLUMN start_time TYPE TIME USING start_time::TIME;
    RAISE NOTICE 'Тип колонки start_time исправлен с TIMESTAMP на TIME';
  END IF;
  
  -- Если колонка end_time имеет тип TIMESTAMP, конвертируем в TIME
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'bookings'
    AND column_name = 'end_time'
    AND data_type LIKE '%timestamp%'
  ) THEN
    ALTER TABLE bookings 
    ALTER COLUMN end_time TYPE TIME USING end_time::TIME;
    RAISE NOTICE 'Тип колонки end_time исправлен с TIMESTAMP на TIME';
  END IF;
END $$;

SELECT 'Скрипт исправления таблицы bookings выполнен' as message; 