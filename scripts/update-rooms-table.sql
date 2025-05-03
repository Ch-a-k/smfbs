-- Скрипт для обновления таблицы rooms
-- Проверяем и добавляем отсутствующие колонки

-- Проверка существования колонки is_active
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'rooms'
    AND column_name = 'is_active'
  ) THEN
    ALTER TABLE rooms ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
    RAISE NOTICE 'Колонка is_active добавлена';
  ELSE
    RAISE NOTICE 'Колонка is_active уже существует';
  END IF;
END $$;

-- Проверка существования колонки max_people
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'rooms'
    AND column_name = 'max_people'
  ) THEN
    -- Сначала добавляем колонку с NULL значением
    ALTER TABLE rooms ADD COLUMN max_people INTEGER;
    
    -- Затем обновляем значения на основе колонки capacity
    UPDATE rooms SET max_people = capacity;
    
    -- Устанавливаем ограничение NOT NULL, если требуется
    ALTER TABLE rooms ALTER COLUMN max_people SET NOT NULL;
    
    RAISE NOTICE 'Колонка max_people добавлена и заполнена значениями из колонки capacity';
  ELSE
    RAISE NOTICE 'Колонка max_people уже существует';
  END IF;
END $$;

-- Проверка существования колонки work_schedule
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'rooms'
    AND column_name = 'work_schedule'
  ) THEN
    ALTER TABLE rooms ADD COLUMN work_schedule JSONB DEFAULT '{
      "monday": {"isActive": true, "startTime": "09:00", "endTime": "22:00"},
      "tuesday": {"isActive": true, "startTime": "09:00", "endTime": "22:00"},
      "wednesday": {"isActive": true, "startTime": "09:00", "endTime": "22:00"},
      "thursday": {"isActive": true, "startTime": "09:00", "endTime": "22:00"},
      "friday": {"isActive": true, "startTime": "09:00", "endTime": "22:00"},
      "saturday": {"isActive": true, "startTime": "10:00", "endTime": "22:00"},
      "sunday": {"isActive": true, "startTime": "10:00", "endTime": "20:00"}
    }'::JSONB;
    RAISE NOTICE 'Колонка work_schedule добавлена с расписанием по умолчанию';
  ELSE
    RAISE NOTICE 'Колонка work_schedule уже существует';
  END IF;
END $$; 