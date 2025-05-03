// Интерфейс для промо-кода
export interface PromoCode {
  code: string;          // Код купона
  discount: number;      // Скидка в процентах
  validUntil: string;    // Дата окончания срока действия
  minAmount?: number;    // Минимальная сумма заказа для применения
  maxUsage?: number;     // Максимальное количество использований
  usageCount: number;    // Текущее количество использований
  isActive: boolean;     // Активен ли промо-код
}

// Хранилище промо-кодов (в реальном приложении это будет в базе данных)
export const promocodes: PromoCode[] = [
  {
    code: 'SUMMER2023',
    discount: 15,
    validUntil: '2023-08-31',
    minAmount: 100,
    maxUsage: 50,
    usageCount: 12,
    isActive: true
  },
  {
    code: 'WELCOME10',
    discount: 10,
    validUntil: '2023-12-31',
    minAmount: 0,
    maxUsage: 100,
    usageCount: 45,
    isActive: true
  },
  {
    code: 'SPECIAL25',
    discount: 25,
    validUntil: '2023-07-15',
    minAmount: 200,
    maxUsage: 20,
    usageCount: 20,
    isActive: false
  },
  {
    code: 'FRIDAY20',
    discount: 20,
    validUntil: '2023-10-31',
    minAmount: 150,
    maxUsage: 30,
    usageCount: 5,
    isActive: true
  }
];

/**
 * Увеличивает счетчик использования промо-кода
 * @param code Код промо-кода
 * @returns true если счетчик успешно увеличен, false если промо-код не найден
 */
export function incrementPromoCodeUsage(code: string): boolean {
  const promoIndex = promocodes.findIndex(promo => promo.code === code);
  if (promoIndex === -1) return false;
  
  promocodes[promoIndex].usageCount += 1;
  return true;
} 