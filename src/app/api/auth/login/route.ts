import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();
    
    // Check if username and password are provided
    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password are required' }, { status: 400 });
    }
    
    // First, authenticate and get token
    const authResponse = await fetch('http://localhost:89/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'accept': 'application/json'
      },
      body: new URLSearchParams({
        username,
        password
      }).toString()
    });
    
    if (!authResponse.ok) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }
    
    const { access_token } = await authResponse.json();
    
    // Then use the token to get user info
    const usersResponse = await fetch('http://localhost:89/api/users', {
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'accept': 'application/json'
      }
    });
    
    if (!usersResponse.ok) {
      return NextResponse.json({ error: 'Failed to fetch user data' }, { status: 500 });
    }
    
    const users = await usersResponse.json();
    const user = users.find((u: any) => u.username === username);
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Return user info
    return NextResponse.json(user);
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}