import { NextResponse } from 'next/server';
import { promocodes, PromoCode } from './data';

export async function GET() {
  // Возвращаем список всех промо-кодов
  return NextResponse.json(promocodes);
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    // Проверяем обязательные поля
    if (!data.code || data.discount === undefined || !data.validUntil) {
      return NextResponse.json(
        { error: 'Missing required fields: code, discount, validUntil' },
        { status: 400 }
      );
    }
    
    // Проверяем, существует ли уже такой код
    if (promocodes.some(promo => promo.code === data.code)) {
      return NextResponse.json(
        { error: 'Promo code already exists' },
        { status: 400 }
      );
    }
    
    // Создаем новый промо-код
    const newPromoCode: PromoCode = {
      code: data.code,
      discount: data.discount,
      validUntil: data.validUntil,
      minAmount: data.minAmount || 0,
      maxUsage: data.maxUsage,
      usageCount: 0,
      isActive: data.isActive !== undefined ? data.isActive : true
    };
    
    // Добавляем в хранилище
    promocodes.push(newPromoCode);
    
    return NextResponse.json(newPromoCode, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: 'Failed to create promo code' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const data = await request.json();
    
    if (!data.code) {
      return NextResponse.json(
        { error: 'Promo code is required' },
        { status: 400 }
      );
    }
    
    // Находим промо-код для обновления
    const promocodeIndex = promocodes.findIndex(promo => promo.code === data.code);
    
    if (promocodeIndex === -1) {
      return NextResponse.json(
        { error: 'Promo code not found' },
        { status: 404 }
      );
    }
    
    // Обновляем данные промо-кода
    const updatedPromoCode = {
      ...promocodes[promocodeIndex],
      discount: data.discount !== undefined ? data.discount : promocodes[promocodeIndex].discount,
      validUntil: data.validUntil !== undefined ? data.validUntil : promocodes[promocodeIndex].validUntil,
      minAmount: data.minAmount !== undefined ? data.minAmount : promocodes[promocodeIndex].minAmount,
      maxUsage: data.maxUsage !== undefined ? data.maxUsage : promocodes[promocodeIndex].maxUsage,
      usageCount: data.usageCount !== undefined ? data.usageCount : promocodes[promocodeIndex].usageCount,
      isActive: data.isActive !== undefined ? data.isActive : promocodes[promocodeIndex].isActive
    };
    
    promocodes[promocodeIndex] = updatedPromoCode;
    
    return NextResponse.json(updatedPromoCode);
  } catch {
    return NextResponse.json(
      { error: 'Failed to update promo code' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  
  if (!code) {
    return NextResponse.json(
      { error: 'Promo code is required' },
      { status: 400 }
    );
  }
  
  // Находим промо-код для удаления
  const promocodeIndex = promocodes.findIndex(promo => promo.code === code);
  
  if (promocodeIndex === -1) {
    return NextResponse.json(
      { error: 'Promo code not found' },
      { status: 404 }
    );
  }
  
  // Удаляем промо-код
  promocodes.splice(promocodeIndex, 1);
  
  return NextResponse.json({ success: true });
} 