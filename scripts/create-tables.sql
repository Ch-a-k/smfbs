-- Скрипт создания таблиц для Supabase

-- Создание таблицы rooms (комнаты)
CREATE TABLE IF NOT EXISTS rooms (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  capacity INTEGER NOT NULL,
  max_people INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT true,
  available BOOLEAN DEFAULT true,
  work_schedule JSONB DEFAULT '{
    "monday": {"isActive": true, "startTime": "09:00", "endTime": "22:00"},
    "tuesday": {"isActive": true, "startTime": "09:00", "endTime": "22:00"},
    "wednesday": {"isActive": true, "startTime": "09:00", "endTime": "22:00"},
    "thursday": {"isActive": true, "startTime": "09:00", "endTime": "22:00"},
    "friday": {"isActive": true, "startTime": "09:00", "endTime": "22:00"},
    "saturday": {"isActive": true, "startTime": "10:00", "endTime": "22:00"},
    "sunday": {"isActive": true, "startTime": "10:00", "endTime": "20:00"}
  }'::jsonb
);

-- Добавление тестовых данных в таблицу rooms
INSERT INTO rooms (name, capacity, max_people, is_active, available)
VALUES 
  ('Pokój 1', 10, 12, true, true),
  ('Pokój 2', 8, 10, true, true),
  ('Pokój VIP', 6, 8, true, true)
ON CONFLICT (id) DO NOTHING;

-- Создание таблицы packages (пакеты услуг)
CREATE TABLE IF NOT EXISTS packages (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10, 2) NOT NULL,
  deposit_amount NUMERIC(10, 2),
  duration INTEGER NOT NULL,
  max_people INTEGER NOT NULL,
  preferred_rooms JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true
);

-- Добавление тестовых данных в таблицу packages
INSERT INTO packages (name, description, price, deposit_amount, duration, max_people, preferred_rooms, is_active)
VALUES 
  ('Standardowy', 'Standardowy pakiet', 150.00, 50.00, 60, 6, '[1,2]'::jsonb, true),
  ('Premium', 'Pakiet premium', 250.00, 100.00, 120, 8, '[1,3]'::jsonb, true),
  ('VIP', 'Pakiet VIP', 400.00, 150.00, 180, 10, '[1,2,3]'::jsonb, true)
ON CONFLICT (id) DO NOTHING;

-- Создание таблицы bookings (бронирования)
CREATE TABLE IF NOT EXISTS bookings (
  id SERIAL PRIMARY KEY,
  room_id INTEGER NOT NULL REFERENCES rooms(id),
  package_id INTEGER NOT NULL REFERENCES packages(id),
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  booking_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  num_people INTEGER NOT NULL,
  status TEXT DEFAULT 'pending',
  total_price NUMERIC(10, 2) NOT NULL,
  paid_amount NUMERIC(10, 2) DEFAULT 0,
  payment_status TEXT DEFAULT 'UNPAID',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  notes TEXT,
  promo_code TEXT,
  discount_percent INTEGER,
  admin_comment TEXT,
  receipt_url TEXT,
  edit_token TEXT
);

-- Создание индексов для таблицы bookings
CREATE INDEX IF NOT EXISTS bookings_room_id_idx ON bookings(room_id);
CREATE INDEX IF NOT EXISTS bookings_package_id_idx ON bookings(package_id);
CREATE INDEX IF NOT EXISTS bookings_booking_date_idx ON bookings(booking_date);
CREATE INDEX IF NOT EXISTS bookings_status_idx ON bookings(status);
CREATE INDEX IF NOT EXISTS bookings_payment_status_idx ON bookings(payment_status);

-- Создание таблицы промокодов (если еще не существует)
CREATE TABLE IF NOT EXISTS promo_codes (
  code TEXT PRIMARY KEY,
  discount_percent INTEGER NOT NULL,
  valid_until DATE,
  is_active BOOLEAN DEFAULT true
);

-- Добавление тестовых промокодов
INSERT INTO promo_codes (code, discount_percent, valid_until, is_active)
VALUES 
  ('HAPPYHOURS', 20, '2024-12-31', true),
  ('WELCOME10', 10, '2024-12-31', true)
ON CONFLICT (code) DO NOTHING;

-- Создание RPC функции для проверки доступности комнаты
CREATE OR REPLACE FUNCTION check_room_availability(
  room_id INTEGER,
  check_date DATE,
  start_time TIME,
  end_time TIME
) RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
  is_available BOOLEAN;
  room_record RECORD;
  day_name TEXT;
  work_schedule JSONB;
  day_schedule JSONB;
BEGIN
  -- Получаем запись комнаты
  SELECT * INTO room_record FROM rooms WHERE id = room_id;
  
  -- Проверяем, существует ли комната и активна ли она
  IF room_record IS NULL OR NOT room_record.is_active OR NOT room_record.available THEN
    RETURN FALSE;
  END IF;
  
  -- Определяем день недели
  day_name := LOWER(TO_CHAR(check_date, 'day'));
  day_name := RTRIM(day_name);
  
  -- Конвертируем в формат ключа в work_schedule
  CASE day_name
    WHEN 'monday' THEN day_name := 'monday';
    WHEN 'tuesday' THEN day_name := 'tuesday';
    WHEN 'wednesday' THEN day_name := 'wednesday';
    WHEN 'thursday' THEN day_name := 'thursday';
    WHEN 'friday' THEN day_name := 'friday';
    WHEN 'saturday' THEN day_name := 'saturday';
    WHEN 'sunday' THEN day_name := 'sunday';
    ELSE day_name := 'monday';
  END CASE;
  
  -- Получаем расписание работы комнаты
  work_schedule := room_record.work_schedule;
  day_schedule := work_schedule->day_name;
  
  -- Проверяем, работает ли комната в этот день
  IF NOT (day_schedule->>'isActive')::BOOLEAN THEN
    RETURN FALSE;
  END IF;
  
  -- Проверяем, попадает ли время в рабочие часы
  IF start_time < (day_schedule->>'startTime')::TIME OR end_time > (day_schedule->>'endTime')::TIME THEN
    RETURN FALSE;
  END IF;
  
  -- Проверяем наличие пересекающихся бронирований
  SELECT EXISTS (
    SELECT 1 FROM bookings
    WHERE bookings.room_id = check_room_availability.room_id
    AND bookings.booking_date = check_date
    AND bookings.status != 'cancelled'
    AND (
      (bookings.start_time <= start_time AND bookings.end_time > start_time) OR
      (bookings.start_time < end_time AND bookings.end_time >= end_time) OR
      (bookings.start_time >= start_time AND bookings.end_time <= end_time)
    )
  ) INTO is_available;
  
  RETURN NOT is_available;
END;
$$; 