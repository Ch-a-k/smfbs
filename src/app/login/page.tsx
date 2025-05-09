'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { LoginCredentials } from '@/types/auth';

export default function LoginPage() {
  const [credentials, setCredentials] = useState<LoginCredentials>({
    username: '',
    password: ''
  });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Redirect to admin if already authenticated
    if (isAuthenticated) {
      console.log('User is already authenticated, redirecting to admin');
      router.push('/admin');
    }
  }, [isAuthenticated, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCredentials(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    
    console.log('Attempting to login with credentials:', { username: credentials.username });

    try {
      const success = await login(credentials);
      console.log('Login result:', success);
      
      if (success) {
        console.log('Login successful, redirecting to admin');
        router.push('/admin');
      } else {
        console.log('Login failed, showing error');
        setError('Nieprawidłowa nazwa użytkownika lub hasło');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Wystąpił błąd podczas logowania');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#f36e21] mx-auto mb-4"></div>
          <h2 className="text-xl text-white">Ładowanie...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-black">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">
            Panel administratora
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Zaloguj się, aby kontynuować
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="p-3 text-sm text-red-700 bg-red-100 rounded-md">
              {error}
            </div>
          )}
          
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                Nazwa użytkownika
              </label>
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                required
                aria-label="Nazwa użytkownika"
                aria-required="true"
                className="appearance-none rounded-t-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-[#f36e21] focus:border-[#f36e21] focus:z-10 sm:text-sm"
                placeholder="Nazwa użytkownika"
                value={credentials.username}
                onChange={handleChange}
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mt-3 mb-1">
                Hasło
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                aria-label="Hasło"
                aria-required="true"
                className="appearance-none rounded-b-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-[#f36e21] focus:border-[#f36e21] focus:z-10 sm:text-sm"
                placeholder="Hasło"
                value={credentials.password}
                onChange={handleChange}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-[#f36e21] hover:bg-[#e05e11] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#f36e21] disabled:opacity-70"
            >
              {isSubmitting ? (
                <>
                  <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                  </span>
                  Logowanie...
                </>
              ) : (
                'Zaloguj się'
              )}
            </button>
          </div>
          
          <div className="text-center text-xs text-gray-500">
            <p>Domyślne dane logowania:</p>
            <p>Login: admin, Hasło: admin123</p>
          </div>
        </form>
      </div>
    </div>
  );
} 