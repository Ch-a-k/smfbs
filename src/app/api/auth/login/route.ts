import { NextRequest, NextResponse } from 'next/server';
import { LoginCredentials } from '@/types/auth';
import { users } from '../../users/route';

export async function POST(request: NextRequest) {
  try {
    const { username, password }: LoginCredentials = await request.json();
    
    // Check if username and password are provided
    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password are required' }, { status: 400 });
    }
    
    // Find user with matching credentials
    const user = users.find(u => 
      u.username === username && u.password === password
    );
    
    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }
    
    // Return user info without password
    const { password: _, ...userInfo } = user;
    return NextResponse.json(userInfo);
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}