import { useState, useEffect } from 'react';
import { apiClient } from '../lib/api-client';

export interface User {
  user_id: number;
  email: string;
  full_name: string;
  role: string;
  telegram_id?: number;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
  token: string | null;
}

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    isLoading: true,
    token: null,
  });

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const userData = localStorage.getItem('user_data');

      if (token && userData) {
        // Проверяем валидность токена на сервере
        try {
          const response = await apiClient.get('/auth/profile', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          if (response.data.user) {
            setAuthState({
              isAuthenticated: true,
              user: response.data.user,
              isLoading: false,
              token,
            });
            return;
          }
        } catch (error) {
          console.error('Ошибка проверки токена:', error);
          // Токен недействителен, очищаем localStorage
          localStorage.removeItem('auth_token');
          localStorage.removeItem('user_data');
        }
      }

      setAuthState({
        isAuthenticated: false,
        user: null,
        isLoading: false,
        token: null,
      });
    } catch (error) {
      console.error('Ошибка проверки авторизации:', error);
      setAuthState({
        isAuthenticated: false,
        user: null,
        isLoading: false,
        token: null,
      });
    }
  };

  const login = (token: string, user: User) => {
    localStorage.setItem('auth_token', token);
    localStorage.setItem('user_data', JSON.stringify(user));
    
    setAuthState({
      isAuthenticated: true,
      user,
      isLoading: false,
      token,
    });
  };

  const logout = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (token) {
        console.log('Отправляем запрос на выход...');
        await apiClient.post('/auth/logout', {}, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        console.log('Запрос на выход выполнен');
      }
    } catch (error) {
      console.error('Ошибка при выходе:', error);
    } finally {
      console.log('Очищаем localStorage и состояние...');
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_data');
      
      setAuthState({
        isAuthenticated: false,
        user: null,
        isLoading: false,
        token: null,
      });
      console.log('Состояние авторизации очищено');
    }
  };

  const updateUser = (updatedUser: User) => {
    localStorage.setItem('user_data', JSON.stringify(updatedUser));
    setAuthState(prev => ({
      ...prev,
      user: updatedUser,
    }));
  };

  return {
    ...authState,
    login,
    logout,
    updateUser,
    checkAuthStatus,
  };
};
