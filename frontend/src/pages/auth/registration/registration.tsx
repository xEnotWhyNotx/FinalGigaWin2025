
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  TextField,
  Button,
  Typography,
  Paper,
  InputAdornment,
  IconButton,
  CircularProgress,
} from '@mui/material';

import {
  Visibility,
  VisibilityOff,
  Email,
  Lock,
  Person,
  PersonAdd,
} from '@mui/icons-material';

import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { apiClient } from '../../../shared/lib/api-client';
import styles from '../authorization/authorization.module.css';

const registrationSchema = z.object({
  email: z.string().min(1, 'Введите email или логин'),
  password: z.string().min(1, 'Введите пароль'),
  confirmPassword: z.string().min(1, 'Подтвердите пароль'),
  fullName: z.string().min(2, 'Имя должно содержать минимум 2 символа'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Пароли не совпадают",
  path: ["confirmPassword"],
});

type RegistrationFormData = z.infer<typeof registrationSchema>;

const REGISTRATION_TEXTS = {
  title: 'Регистрация',
  subtitle: 'Создайте новый аккаунт',
  description: 'Присоединяйтесь к нашей платформе управления водными ресурсами',
  formTitle: 'Регистрация',
  formSubtitle: 'Заполните форму для создания аккаунта',
  emailLabel: 'Email или логин',
  passwordLabel: 'Пароль',
  confirmPasswordLabel: 'Подтвердите пароль',
  fullNameLabel: 'Полное имя',
  registerButton: 'Зарегистрироваться',
  loadingButton: 'Регистрация...',
  hasAccount: 'Уже есть аккаунт?',
  login: 'Войти',
  loginToast: 'Переход на страницу входа...'
} as const;

export const Registration: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formShake, setFormShake] = useState(false);
  const [successAnimation, setSuccessAnimation] = useState(false);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegistrationFormData>({
    resolver: zodResolver(registrationSchema),
  });

  // Анимация ошибки
  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      setFormShake(true);
      setTimeout(() => setFormShake(false), 500);
    }
  }, [errors]);

  // Анимация успешной регистрации
  useEffect(() => {
    if (isLoading) {
      setSuccessAnimation(true);
    }
  }, [isLoading]);

  const onSubmit = async (data: RegistrationFormData) => {
    setIsLoading(true);
    try {
      console.log('Данные для регистрации:', data);
      
      const response = await apiClient.post('/auth/register', {
        email: data.email,
        password: data.password,
        full_name: data.fullName,
      });

      if (response.data.user_id) {
        toast.success('Регистрация выполнена успешно! Теперь войдите в систему.');
        
        // Перенаправляем на страницу авторизации
        setTimeout(() => {
          navigate('/authorization');
        }, 1500);
      }
    } catch (error: any) {
      console.error('Ошибка регистрации:', error);
      
      if (error.response?.status === 400) {
        toast.error('Пользователь с таким email уже существует');
      } else {
        toast.error('Ошибка при регистрации. Попробуйте еще раз');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginClick = () => {
    toast.success(REGISTRATION_TEXTS.loginToast);
    setTimeout(() => {
      navigate('/authorization');
    }, 500);
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.imageSection}>
        <div className={styles.imageContent}>
          <Typography variant="h2" className={styles.imageTitle}>
            {REGISTRATION_TEXTS.title}
          </Typography>
          <Typography variant="h5" className={styles.imageSubtitle}>
            {REGISTRATION_TEXTS.subtitle}
          </Typography>
          <Typography variant="body1" className={styles.imageDescription}>
            {REGISTRATION_TEXTS.description}
          </Typography>
        </div>
      </div>
      <div className={styles.formSection}>
        <Paper 
          className={`${styles.formPaper} ${formShake ? styles.errorShake : ''} ${successAnimation ? styles.successPulse : ''}`}
        >
          <div className={styles.formHeader}>
            <Typography variant="h4" className={styles.formTitle}>
              {REGISTRATION_TEXTS.formTitle}
            </Typography>
            <Typography variant="body1" className={styles.formSubtitle}>
              {REGISTRATION_TEXTS.formSubtitle}
            </Typography>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
            <TextField
              size="small"
              fullWidth
              label={REGISTRATION_TEXTS.fullNameLabel}
              type="text"
              {...register('fullName')}
              error={!!errors.fullName}
              helperText={errors.fullName?.message}
              className={styles.textField}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Person color="action" />
                  </InputAdornment>
                ),
              }}
              variant="outlined"
              disabled={isSubmitting}
            />

            <TextField
              size="small"
              fullWidth
              label={REGISTRATION_TEXTS.emailLabel}
              type="text"
              {...register('email')}
              error={!!errors.email}
              helperText={errors.email?.message}
              className={styles.textField}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Email color="action" />
                  </InputAdornment>
                ),
              }}
              variant="outlined"
              disabled={isSubmitting}
            />

            <TextField
              size="small"
              fullWidth
              label={REGISTRATION_TEXTS.passwordLabel}
              type={showPassword ? 'text' : 'password'}
              {...register('password')}
              error={!!errors.password}
              helperText={errors.password?.message}
              className={styles.textField}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock color="action" />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                      disabled={isSubmitting}
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              variant="outlined"
              disabled={isSubmitting}
            />

            <TextField
              size="small"
              fullWidth
              label={REGISTRATION_TEXTS.confirmPasswordLabel}
              type={showConfirmPassword ? 'text' : 'password'}
              {...register('confirmPassword')}
              error={!!errors.confirmPassword}
              helperText={errors.confirmPassword?.message}
              className={styles.textField}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock color="action" />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      edge="end"
                      disabled={isSubmitting}
                    >
                      {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              variant="outlined"
              disabled={isSubmitting}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="medium"
              disabled={isSubmitting}
              className={`${styles.loginButton} ${isSubmitting ? styles.loading : ''}`}
              startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : <PersonAdd />}
            >
              {isSubmitting ? REGISTRATION_TEXTS.loadingButton : REGISTRATION_TEXTS.registerButton}
            </Button>
          </form>

          <div className={styles.footer}>
            <Typography variant="body2" className={styles.footerText}>
              {REGISTRATION_TEXTS.hasAccount}{' '}
              <Button
                variant="text"
                color="primary"
                className={styles.registerButton}
                onClick={handleLoginClick}
                disabled={isSubmitting}
              >
                {REGISTRATION_TEXTS.login}
              </Button>
            </Typography>
          </div>
        </Paper>
      </div>
    </div>
  );
};

