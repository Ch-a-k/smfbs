import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Получаем и валидируем данные
    let credentials;
    try {
      credentials = await request.json();
    } catch (e) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const { username, password } = credentials;
    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password are required' }, { status: 400 });
    }

    // Подготавливаем form-data с правильным кодированием
    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', encodeURIComponent(password)); // Кодируем специальные символы

    // Запрос токена
    const authResponse = await fetch('http://localhost:89/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
      },
      body: formData.toString()
    });

    if (!authResponse.ok) {
      let errorData;
      try {
        errorData = await authResponse.json();
      } catch {
        errorData = { detail: 'Authentication failed' };
      }
      return NextResponse.json(
        { error: errorData.detail || 'Invalid credentials' },
        { status: authResponse.status }
      );
    }

    const { access_token } = await authResponse.json();

    // Запрос данных пользователя (убрал Content-Type, так как это GET запрос)
    const usersResponse = await fetch('http://localhost:89/api/users', {
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'Accept': 'application/json',
      }
    });

    if (!usersResponse.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch user data' },
        { status: usersResponse.status }
      );
    }

    const users = await usersResponse.json();
    const user = users.find((u: any) => u.username === username);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Устанавливаем secure cookie
    const response = NextResponse.json(user);
    response.cookies.set('access_token', access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 86400
    });

    return response;
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}