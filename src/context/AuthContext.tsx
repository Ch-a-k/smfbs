'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, AuthContextType, LoginCredentials, AuthState } from '@/types/auth';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';

// Mock user data
const MOCK_USERS = [
  {
    id: '1',
    username: 'admin',
    password: 'admin123',
    role: 'admin' as const,
    name: 'Администратор',
  },
  {
    id: '2',
    username: 'user',
    password: 'user123',
    role: 'user' as const,
    name: 'Пользователь',
  },
];

// Начальное состояние
const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
};

// Создаем контекст аутентификации
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Провайдер для контекста аутентификации
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>(initialState);
  const router = useRouter();

  // Проверяем статус аутентификации при загрузке
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const userCookie = Cookies.get('user');
        
        if (userCookie) {
          const userData = JSON.parse(userCookie);
          setState({
            user: userData,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } else {
          setState(prev => ({ ...prev, isLoading: false }));
        }
      } catch (error) {
        console.error('Error checking auth status:', error);
        setState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: 'Failed to check auth status',
        });
      }
    };

    checkAuthStatus();
  }, []);

  // Функция для входа в систему
  const login = async (credentials: LoginCredentials): Promise<boolean> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Проверка учетных данных с нашими мок-данными
      const foundUser = MOCK_USERS.find(
        u => u.username === credentials.username && u.password === credentials.password
      );
      
      if (foundUser) {
        const { password, ...userWithoutPassword } = foundUser;
        setState({
          user: userWithoutPassword,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
        // Сохраняем данные пользователя в cookies
        Cookies.set('user', JSON.stringify(userWithoutPassword), { expires: 1 });
        return true;
      } else {
        setState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: 'Invalid credentials',
        });
        return false;
      }
    } catch (error) {
      console.error('Login error:', error);
      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: 'Login failed',
      });
      return false;
    }
  };

  // Функция для выхода из системы
  const logout = async (): Promise<void> => {
    // Удаляем данные пользователя из cookies
    Cookies.remove('user');

    setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
  };

  return (
    <AuthContext.Provider value={{ ...state, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// Хук для использования контекста аутентификации
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 