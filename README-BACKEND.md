# Документация по API для бэкенд-разработчика

## Обзор

Данный документ содержит информацию о структуре API для системы бронирования **Smash & Fun**, которая в текущей реализации работает с локальными моками данных. Ваша задача - реализовать эти API с использованием PostgreSQL, JWT аутентификации и других необходимых технологий.

## Структура данных

### Основные модели

#### Бронирование (Booking)

```typescript
export interface Booking {
  id: number;
  packageId: number;
  packageName: string;
  roomId: number;
  roomName: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  date: string; // Формат YYYY-MM-DD
  startTime: string; // Формат HH:MM
  endTime: string; // Формат HH:MM
  numPeople: number;
  notes: string;
  promoCode: string;
  totalPrice: number;
  paymentStatus: 'UNPAID' | 'DEPOSIT_PAID' | 'FULLY_PAID';
  paidAmount: number;
  depositAmount?: number;
  status: string; // 'pending', 'confirmed', 'cancelled'
  createdAt: string;
  updatedAt: string;
}
```

#### Пакет услуг (Package)

```typescript
export interface Package {
  id: string | number;
  name: string;
  description: string;
  price: number;
  depositAmount: number;
  duration: number; // В минутах
  maxPeople: number;
  preferredRooms?: number[]; // Предпочтительные комнаты для этого пакета
  isActive?: boolean; // Активен ли пакет
  isBestseller?: boolean; // Является ли этот пакет бестселлером
}
```

#### Комната (Room)

```typescript
export interface Room {
  id: number;
  name: string;
  capacity: number;
  available: boolean;
  maxPeople: number; // Максимальное количество людей
  isActive: boolean; // Активна ли комната
  workSchedule: RoomSchedule; // Расписание работы комнаты
}

export interface RoomSchedule {
  monday: DaySchedule;
  tuesday: DaySchedule;
  wednesday: DaySchedule;
  thursday: DaySchedule;
  friday: DaySchedule;
  saturday: DaySchedule;
  sunday: DaySchedule;
}

export interface DaySchedule {
  isActive: boolean; // Активен ли день
  startTime: string; // Время начала работы, формат HH:MM
  endTime: string; // Время окончания работы, формат HH:MM
}
```

#### Временной слот (TimeSlot)

```typescript
export interface TimeSlot {
  id: string;
  startTime: string; // Формат HH:MM
  endTime: string; // Формат HH:MM
  available: boolean;
  availableRooms?: number[]; // Доступные комнаты для этого временного слота
}
```

#### Промокод (PromoCode)

```typescript
export type PromoCode = {
  code: string;
  discountPercent: number;
  isActive: boolean;
};
```

#### Дополнительные товары (CrossSellItem)

```typescript
export type CrossSellItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  isActive: boolean;
};
```

## API Endpoints

### Бронирования

#### GET /api/bookings
- **Описание**: Получение всех бронирований
- **Параметры запроса**: Нет
- **Ответ**: Массив объектов Booking

#### GET /api/bookings?id={id}
- **Описание**: Получение бронирования по ID
- **Параметры запроса**: `id` - ID бронирования
- **Ответ**: Объект Booking или ошибка 404

#### GET /api/bookings?date={date}
- **Описание**: Получение бронирований на определенную дату
- **Параметры запроса**: `date` - Дата в формате YYYY-MM-DD
- **Ответ**: Массив объектов Booking

#### GET /api/bookings?type=timeslots&date={date}&packageId={packageId}
- **Описание**: Получение доступных временных слотов для конкретной даты и пакета
- **Параметры запроса**: 
  - `date` - Дата в формате YYYY-MM-DD
  - `packageId` - ID пакета
- **Ответ**: Массив объектов TimeSlot

#### POST /api/bookings
- **Описание**: Создание нового бронирования
- **Тело запроса**: Объект BookingFormData
- **Ответ**: Созданный объект Booking

#### PUT /api/bookings?id={id}
- **Описание**: Обновление существующего бронирования
- **Параметры запроса**: `id` - ID бронирования
- **Тело запроса**: Частичный объект Booking
- **Ответ**: Обновленный объект Booking

#### DELETE /api/bookings?id={id}
- **Описание**: Удаление/отмена бронирования
- **Параметры запроса**: `id` - ID бронирования
- **Ответ**: `{ success: true, message: 'Бронирование успешно удалено' }`

### Пакеты услуг

#### GET /api/packages
- **Описание**: Получение всех пакетов
- **Параметры запроса**: Нет
- **Ответ**: Массив объектов Package

#### GET /api/packages?id={id}
- **Описание**: Получение пакета по ID
- **Параметры запроса**: `id` - ID пакета
- **Ответ**: Объект Package или ошибка 404

#### POST /api/packages
- **Описание**: Создание нового пакета
- **Тело запроса**: Объект Package
- **Ответ**: Созданный объект Package

#### PUT /api/packages?id={id}
- **Описание**: Обновление существующего пакета
- **Параметры запроса**: `id` - ID пакета
- **Тело запроса**: Частичный объект Package
- **Ответ**: Обновленный объект Package

#### DELETE /api/packages?id={id}
- **Описание**: Удаление пакета
- **Параметры запроса**: `id` - ID пакета
- **Ответ**: `{ success: true, message: 'Пакет успешно удален' }`

### Комнаты

#### GET /api/rooms
- **Описание**: Получение всех комнат
- **Параметры запроса**: Нет
- **Ответ**: Массив объектов Room

#### GET /api/rooms?id={id}
- **Описание**: Получение комнаты по ID
- **Параметры запроса**: `id` - ID комнаты
- **Ответ**: Объект Room или ошибка 404

#### POST /api/rooms
- **Описание**: Создание новой комнаты
- **Тело запроса**: Объект Room (без id)
- **Ответ**: Созданный объект Room

#### PUT /api/rooms?id={id}
- **Описание**: Обновление существующей комнаты
- **Параметры запроса**: `id` - ID комнаты
- **Тело запроса**: Частичный объект Room
- **Ответ**: Обновленный объект Room

#### DELETE /api/rooms?id={id}
- **Описание**: Удаление комнаты
- **Параметры запроса**: `id` - ID комнаты
- **Ответ**: `{ success: true, message: 'Комната успешно удалена' }`

### Доступность

#### GET /api/bookings/availability?date={date}&packageId={packageId}
- **Описание**: Получение доступных слотов для бронирования на конкретную дату и пакет
- **Параметры запроса**: 
  - `date` - Дата в формате YYYY-MM-DD
  - `packageId` - ID пакета
- **Ответ**: Массив объектов TimeSlot

### Кросс-селл

#### GET /api/cross-sell
- **Описание**: Получение всех товаров для кросс-селла
- **Параметры запроса**: Нет
- **Ответ**: Массив объектов CrossSellItem

#### GET /api/cross-sell?id={id}
- **Описание**: Получение товара для кросс-селла по ID
- **Параметры запроса**: `id` - ID товара
- **Ответ**: Объект CrossSellItem или ошибка 404

### Промокоды

#### POST /api/promo-codes
- **Описание**: Применение промокода к цене
- **Тело запроса**: `{ promoCode: string, price: number }`
- **Ответ**: `{ price: number, discount?: number }`

### Аналитика

#### GET /api/analytics
- **Описание**: Получение аналитических данных по бронированиям
- **Параметры запроса**: Нет
- **Ответ**:
```typescript
{
  totalBookings: number;
  fullyPaidBookings: number;
  depositPaidBookings: number;
  unpaidBookings: number;
  totalRevenue: number;
  packageStats: {
    [packageId: string]: {
      bookingsCount: number;
      revenue: number;
    }
  };
}
```

## Аутентификация и авторизация

Рекомендуется реализовать следующие эндпоинты для аутентификации и авторизации:

### POST /api/auth/login
- **Описание**: Аутентификация пользователя
- **Тело запроса**: `{ email: string, password: string }`
- **Ответ**: `{ user: User, token: string }`

### POST /api/auth/register
- **Описание**: Регистрация нового пользователя (только для администраторов)
- **Тело запроса**: `{ email: string, password: string, name: string, role: string }`
- **Ответ**: `{ user: User, token: string }`

### GET /api/auth/me
- **Описание**: Получение информации о текущем пользователе
- **Заголовки**: `Authorization: Bearer {token}`
- **Ответ**: `{ user: User }`

### POST /api/auth/refresh
- **Описание**: Обновление JWT токена
- **Тело запроса**: `{ refreshToken: string }`
- **Ответ**: `{ token: string, refreshToken: string }`

## Дополнительно

### Локальные моки

В текущей реализации используются локальные моки данных, которые находятся в файлах `/src/lib/mock-data.ts` и `/src/lib/mock-api.ts`. Они могут послужить хорошим примером для реализации API и структуры данных.

### Транзакции платежей

В будущем планируется интеграция с платежной системой. Рекомендуется предусмотреть следующие эндпоинты:

#### POST /api/payments/initialize
- **Описание**: Инициализация платежа
- **Тело запроса**: `{ bookingId: number, amount: number, type: 'FULL' | 'DEPOSIT' }`
- **Ответ**: `{ redirectUrl: string, transactionId: string }`

#### POST /api/payments/webhook
- **Описание**: Вебхук для обработки результатов платежа
- **Тело запроса**: Зависит от платежной системы
- **Ответ**: Статус обработки вебхука

#### GET /api/payments?bookingId={bookingId}
- **Описание**: Получение информации о платежах для конкретного бронирования
- **Параметры запроса**: `bookingId` - ID бронирования
- **Ответ**: Массив объектов Payment

## Оптимизации и безопасность

Рекомендуется реализовать следующие оптимизации и меры безопасности:

1. **Кэширование**: Для частых запросов, таких как получение списка пакетов или комнат.
2. **Валидация**: Все данные должны проходить валидацию перед сохранением в БД.
3. **Ограничение скорости запросов (Rate Limiting)**: Для предотвращения DDoS атак.
4. **CORS**: Настройка CORS для разрешения запросов только с доверенных доменов.
5. **Логирование**: Логирование важных событий и ошибок.
6. **Тесты**: Юнит-тесты и интеграционные тесты для API.

## Заключение

Данный документ содержит основную информацию для реализации бэкенда системы бронирования. При возникновении вопросов обращайтесь к фронтенд-разработчику или к документации фронтенд-кода. 