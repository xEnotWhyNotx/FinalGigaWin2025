import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginFormData } from "./authorization.schemas";
import { apiClient } from "../../../shared/lib/api-client";
import { useAuth } from "../../../shared/hooks/use-auth";

export const useAuthorization = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: 'admin',
      password: 'admin'
    }
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      console.log('Данные для входа:', data);
      console.log('Тип данных:', typeof data);
      console.log('Email:', data.email, 'Password:', data.password);
      
      const response = await apiClient.post('/auth/login', {
        email: data.email,
        password: data.password,
      });

      console.log('Ответ сервера:', response.data);

      if (response.data.session_token) {
        // Используем хук useAuth для входа
        login(response.data.session_token, response.data.user);
        
        console.log('Токен сохранен, перенаправляем...');
        
        toast.success('Вход выполнен успешно!');
        
        // Принудительное перенаправление без задержки
        console.log('Выполняем навигацию на /');
        navigate('/', { replace: true });
        
        // Дополнительная проверка через небольшую задержку
        setTimeout(() => {
          if (window.location.pathname === '/authorization') {
            console.log('Принудительное перенаправление...');
            window.location.href = '/';
          }
        }, 100);
      } else {
        console.error('Токен не получен:', response.data);
        toast.error('Ошибка: токен не получен');
      }
    } catch (error: any) {
      console.error('Ошибка авторизации:', error);
      
      if (error.response?.status === 401) {
        toast.error('Неверный email или пароль');
      } else if (error.response?.status === 400) {
        toast.error('Проверьте правильность введенных данных');
      } else {
        toast.error('Ошибка при входе. Попробуйте еще раз');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return {
    setShowPassword,
    showPassword,
    onSubmit,
    register,
    handleSubmit,
    errors,
    isSubmitting: isSubmitting || isLoading,
    isLoading
  }
}