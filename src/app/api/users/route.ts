import { NextRequest, NextResponse } from 'next/server';
import { User } from '@/types/auth';

// In a real application, this would be stored in a database
// For demonstration purposes, we're using an in-memory array
export let users: (User & { password: string; id: string })[] = [
  {
    id: '1',
    username: 'admin',
    password: 'admin123', // In a real app, this would be hashed
    role: 'admin',
    name: 'Администратор'
  }
];

// Get all users or a specific user by id
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const username = searchParams.get('username');
    
    // Check if the request is authenticated as admin
    const userCookie = request.cookies.get('user')?.value;
    if (!userCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // If searching by username
    if (username) {
      const user = users.find(user => user.username === username);
      if (user) {
        // Don't send password in response
        const { password, ...userWithoutPassword } = user;
        return NextResponse.json([userWithoutPassword]);
      }
      return NextResponse.json([]);
    }

    // If searching by ID
    if (id) {
      const user = users.find(user => user.id === id);
      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
      
      // Don't send password in response
      const { password, ...userWithoutPassword } = user;
      return NextResponse.json(userWithoutPassword);
    }

    // Check if the user making the request is an admin for listing all users
    const requestingUser = users.find(user => user.username === userCookie);
    if (!requestingUser || requestingUser.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Return all users without passwords
    const usersWithoutPasswords = users.map(({ password, ...user }) => user);
    return NextResponse.json(usersWithoutPasswords);
  } catch (error: any) {
    console.error('Error getting users:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Create a new user
export async function POST(request: NextRequest) {
  try {
    // Check if the request is authenticated as admin
    const userCookie = request.cookies.get('user')?.value;
    if (!userCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if the user making the request is an admin
    const requestingUser = users.find(user => user.username === userCookie);
    if (!requestingUser || requestingUser.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const userData = await request.json();
    
    // Validate required fields
    if (!userData.username || !userData.password || !userData.name || !userData.role) {
      return NextResponse.json(
        { error: 'Username, password, name, and role are required' }, 
        { status: 400 }
      );
    }
    
    // Check if username already exists
    if (users.some(user => user.username === userData.username)) {
      return NextResponse.json(
        { error: 'Username already exists' }, 
        { status: 409 }
      );
    }
    
    // Create new user
    const newUser = {
      id: Date.now().toString(),
      username: userData.username,
      password: userData.password, // In a real app, this would be hashed
      role: userData.role,
      name: userData.name
    };
    
    users.push(newUser);
    
    // Return user without password
    const { password, ...userWithoutPassword } = newUser;
    return NextResponse.json(userWithoutPassword, { status: 201 });
  } catch (error: any) {
    console.error('Error creating user:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Update an existing user
export async function PUT(request: NextRequest) {
  try {
    // Check if the request is authenticated as admin
    const userCookie = request.cookies.get('user')?.value;
    if (!userCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if the user making the request is an admin
    const requestingUser = users.find(user => user.username === userCookie);
    if (!requestingUser || requestingUser.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const userData = await request.json();
    
    if (!userData.id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }
    
    const userIndex = users.findIndex(user => user.id === userData.id);
    if (userIndex === -1) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Check if it's the super admin (first user)
    if (userData.id === '1' && (userData.role !== 'admin' || userData.username !== 'admin')) {
      return NextResponse.json(
        { error: 'Cannot change role or username of super admin' }, 
        { status: 403 }
      );
    }
    
    // Check if username is being changed and if it already exists
    if (
      userData.username !== users[userIndex].username && 
      users.some(user => user.username === userData.username)
    ) {
      return NextResponse.json(
        { error: 'Username already exists' }, 
        { status: 409 }
      );
    }
    
    // Update user
    const updatedUser = {
      ...users[userIndex],
      username: userData.username || users[userIndex].username,
      name: userData.name || users[userIndex].name,
      role: userData.role || users[userIndex].role
    };
    
    // Update password only if provided
    if (userData.password) {
      updatedUser.password = userData.password; // In a real app, this would be hashed
    }
    
    users[userIndex] = updatedUser;
    
    // Return user without password
    const { password, ...userWithoutPassword } = updatedUser;
    return NextResponse.json(userWithoutPassword);
  } catch (error: any) {
    console.error('Error updating user:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Delete a user
export async function DELETE(request: NextRequest) {
  try {
    // Check if the request is authenticated as admin
    const userCookie = request.cookies.get('user')?.value;
    if (!userCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if the user making the request is an admin
    const requestingUser = users.find(user => user.username === userCookie);
    if (!requestingUser || requestingUser.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }
    
    // Prevent deletion of super admin
    if (id === '1') {
      return NextResponse.json(
        { error: 'Cannot delete super admin' }, 
        { status: 403 }
      );
    }
    
    const initialLength = users.length;
    users = users.filter(user => user.id !== id);
    
    if (users.length === initialLength) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting user:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}