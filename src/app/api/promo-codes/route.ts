import { NextRequest, NextResponse } from 'next/server';
import { applyPromoCode } from '@/lib/mock-api';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const promoCode = data.promoCode;
    const price = data.price;
    
    if (!promoCode || price === undefined) {
      return NextResponse.json({ 
        error: 'Необходимо указать код и цену' 
      }, { status: 400 });
    }
    
    const result = await applyPromoCode(price, promoCode);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Ошибка при применении промокода:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 