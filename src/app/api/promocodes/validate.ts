import { NextResponse } from 'next/server';
import { promocodes, PromoCode } from './data';

/**
 * Проверяет валидность промо-кода и возвращает размер скидки
 * @param code Промо-код для проверки
 * @param amount Сумма заказа
 * @returns Объект с информацией о скидке или ошибке
 */
export async function validatePromoCode(code: string, amount: number) {
  // Находим промо-код
  const promoCode = promocodes.find((promo: PromoCode) => promo.code === code);
  
  // Если промо-код не найден
  if (!promoCode) {
    return {
      valid: false,
      error: 'Promo code not found',
      discount: 0
    };
  }
  
  // Если промо-код неактивен
  if (!promoCode.isActive) {
    return {
      valid: false,
      error: 'Promo code is inactive',
      discount: 0
    };
  }
  
  // Проверяем срок действия
  const validUntil = new Date(promoCode.validUntil);
  const now = new Date();
  if (validUntil < now) {
    return {
      valid: false,
      error: 'Promo code has expired',
      discount: 0
    };
  }
  
  // Проверяем количество использований
  if (promoCode.maxUsage !== undefined && promoCode.usageCount >= promoCode.maxUsage) {
    return {
      valid: false,
      error: 'Promo code usage limit reached',
      discount: 0
    };
  }
  
  // Проверяем минимальную сумму заказа
  if (promoCode.minAmount !== undefined && amount < promoCode.minAmount) {
    return {
      valid: false,
      error: `Minimum order amount is ${promoCode.minAmount}`,
      discount: 0
    };
  }
  
  // Промо-код валиден
  return {
    valid: true,
    discount: promoCode.discount,
    code: promoCode.code
  };
}

/**
 * API роут для проверки промо-кода
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const amountStr = url.searchParams.get('amount');
  
  if (!code) {
    return NextResponse.json(
      { error: 'Promo code is required' },
      { status: 400 }
    );
  }
  
  // Преобразуем строку суммы в число
  const amount = amountStr ? parseFloat(amountStr) : 0;
  
  const result = await validatePromoCode(code, amount);
  
  if (!result.valid) {
    return NextResponse.json(
      { error: result.error, valid: false },
      { status: 400 }
    );
  }
  
  return NextResponse.json(result);
} 