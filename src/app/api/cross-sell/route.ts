import { NextRequest, NextResponse } from 'next/server';
import { getAllCrossSellItems, getCrossSellItemById } from '@/lib/mock-api';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // Получение конкретного товара по ID
    if (id) {
      const item = await getCrossSellItemById(id);
      if (!item) {
        return NextResponse.json({ error: 'Товар не найден' }, { status: 404 });
      }
      return NextResponse.json(item);
    }

    // Получение всех товаров
    const items = await getAllCrossSellItems();
    return NextResponse.json(items);
  } catch (error: any) {
    console.error('Ошибка при получении товаров кросс-селла:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 