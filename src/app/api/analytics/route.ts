import { NextRequest, NextResponse } from 'next/server';
import { getBookingAnalytics } from '@/lib/mock-api';

export async function GET() {
  try {
    const analytics = await getBookingAnalytics();
    return NextResponse.json(analytics);
  } catch (error: any) {
    console.error('Ошибка при получении аналитики:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 