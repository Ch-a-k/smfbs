'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { LoginCredentials, User } from '@/types/auth';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  currentUser: User | null;
  isSuperAdmin: boolean;
  login: (credentials: LoginCredentials) => Promise<boolean>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  // Проверяем, авторизован ли пользователь при загрузке
  useEffect(() => {
    const checkAuth = () => {
      const userCookie = document.cookie
        .split('; ')
        .find(row => row.startsWith('user='));
      
      if (userCookie) {
        const username = userCookie.split('=')[1];
        
        // Устанавливаем базовую аутентификацию
        setIsAuthenticated(true);
        
        // Если это суперадмин
        if (username === 'admin') {
          setIsSuperAdmin(true);
          setCurrentUser({
            id: '1',
            username: 'admin',
            role: 'admin',
            name: 'Администратор'
          });
        } else {
          // В реальном приложении здесь был бы запрос к API для получения данных пользователя
          // по сохраненному токену
          fetch(`/api/users?username=${username}`)
            .then(res => res.json())
            .then(data => {
              if (data && data.length > 0) {
                const user = data[0];
                setCurrentUser(user);
                setIsSuperAdmin(user.username === 'admin');
              }
            })
            .catch(err => {
              console.error('Error fetching user data:', err);
            });
        }
      }
      
      setIsLoading(false);
    };
    
    checkAuth();
  }, []);

  // Функция для входа
  const login = async (credentials: LoginCredentials): Promise<boolean> => {
    try {
      const response = await fetch('http://localhost:89/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          username: credentials.username,
          password: credentials.password
        }).toString()
      });

      if (!response.ok) {
        return false;
      }

      const tokenData = await response.json();

      if (tokenData && tokenData.access_token) {
        // Сохраняем токен и имя пользователя в куки
        document.cookie = `access_token=${tokenData.access_token}; path=/; max-age=86400; Secure`;
        document.cookie = `user=${credentials.username}; path=/; max-age=86400; Secure`;

        setIsAuthenticated(true);
        setCurrentUser({
          id: tokenData.user_id.toString(),
          username: credentials.username,
          role: credentials.username === 'admin' ? 'admin' : 'user',
          name: credentials.username
        });
        setIsSuperAdmin(credentials.username === 'admin');
        return true;
      }

      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  // Функция для выхода
  const logout = async (): Promise<void> => {
    // Удаляем cookie
    document.cookie = 'user=; path=/; max-age=0';
    setIsAuthenticated(false);
    setCurrentUser(null);
    setIsSuperAdmin(false);
  };

  return (
    <AuthContext.Provider value={{ 
      isAuthenticated, 
      isLoading, 
      currentUser, 
      isSuperAdmin, 
      login, 
      logout 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 