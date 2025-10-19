import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { CircularProgress, Box, Typography } from '@mui/material';
import { useAuth } from '../hooks/use-auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  redirectTo?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireAuth = true,
  redirectTo = '/authorization',
}) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  console.log('ProtectedRoute:', { isAuthenticated, isLoading, requireAuth, location: location.pathname });

  // Показываем загрузку во время проверки авторизации
  if (isLoading) {
    console.log('ProtectedRoute: Показываем загрузку');
    return (
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        minHeight="100vh"
        sx={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        }}
      >
        <CircularProgress size={60} sx={{ color: 'white', mb: 2 }} />
        <Typography variant="h6" sx={{ color: 'white', opacity: 0.8 }}>
          Проверка авторизации...
        </Typography>
      </Box>
    );
  }

  // Если требуется авторизация, но пользователь не авторизован
  if (requireAuth && !isAuthenticated) {
    console.log('ProtectedRoute: Перенаправляем на авторизацию');
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // Если авторизация не требуется, но пользователь авторизован (например, на странице входа)
  if (!requireAuth && isAuthenticated) {
    console.log('ProtectedRoute: Перенаправляем на главную');
    return <Navigate to="/" replace />;
  }

  console.log('ProtectedRoute: Показываем содержимое');
  return <>{children}</>;
};
