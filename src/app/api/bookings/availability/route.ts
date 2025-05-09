import { NextRequest, NextResponse } from 'next/server';
import { format, parseISO } from 'date-fns';
import { 
  getAvailableTimeSlots,
  getPackageById,
  getAllRooms
} from '@/lib/mock-api';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const packageId = searchParams.get('packageId');
    
    if (!date) {
      return NextResponse.json({ error: 'Дата не указана' }, { status: 400 });
    }
    
    if (!packageId) {
      return NextResponse.json({ error: 'ID пакета не указан' }, { status: 400 });
    }
    
    // Проверяем существование пакета
      const pkg = await getPackageById(packageId);
      if (!pkg) {
      return NextResponse.json({ error: 'Пакет не найден' }, { status: 404 });
    }
    
    // Получаем доступные временные слоты для выбранной даты и пакета
    const timeSlots = await getAvailableTimeSlots(date, packageId);
    
      return NextResponse.json({
      date,
      packageId,
      timeSlots
    });
  } catch (error: any) {
    console.error('Ошибка при получении доступности:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 