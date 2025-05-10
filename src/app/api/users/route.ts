// /app/api/users/route.ts
import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = 'http://localhost:89/api';

// Универсальный fetch с авторизацией
async function authFetch(
  request: NextRequest,
  endpoint: string,
  method: string = 'GET',
  body?: any
) {
  const token = request.cookies.get('access_token')?.value;

  if (!token) {
    throw new Error('Authentication required');
  }
  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
    cache: 'no-store',
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.detail || 'Request failed');
  }

  return res;
}

// Получение пользователей
export async function GET(request: NextRequest) {
  try {
    const id = new URL(request.url).searchParams.get('id');
    const res = await authFetch(request, id ? `/users/${id}` : '/users');
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('GET Error:', error.message);
    return error.message.includes('Authentication')
      ? NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      : error.message.includes('not found')
      ? NextResponse.json({ error: 'Not found' }, { status: 404 })
      : NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}

// Создание пользователя
export async function POST(request: NextRequest) {
  try {
    const userData = await request.json();

    if (!userData?.username || !userData?.password || !userData?.email) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const res = await authFetch(request, '/users', 'POST', userData);
    const data = await res.json();
    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    console.error('POST Error:', error.message);
    return error.message.includes('already registered')
      ? NextResponse.json({ error: 'User exists' }, { status: 409 })
      : NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}

// Обновление пользователя
export async function PUT(request: NextRequest) {
  try {
    const userData = await request.json();

    if (!userData?.id) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    const res = await authFetch(request, `/users/${userData.id}`, 'PUT', userData);
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('PUT Error:', error.message);
    return error.message.includes('not found')
      ? NextResponse.json({ error: 'User not found' }, { status: 404 })
      : NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}

// Удаление пользователя
export async function DELETE(request: NextRequest) {
  try {
    const id = new URL(request.url).searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    await authFetch(request, `/users/${id}`, 'DELETE');
    return new NextResponse(null, { status: 204 });
  } catch (error: any) {
    console.error('DELETE Error:', error.message);
    return error.message.includes('not found')
      ? NextResponse.json({ error: 'Not found' }, { status: 404 })
      : NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}