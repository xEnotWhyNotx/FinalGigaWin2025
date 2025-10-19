import { Outlet, useNavigate } from "react-router-dom";
import { AppBar, Toolbar, Typography, Box, IconButton } from '@mui/material';
import { Logout, AccountCircle } from '@mui/icons-material';
import { useAuth } from '../../shared/hooks/use-auth';
import toast from 'react-hot-toast';

export const Wrapper = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    try {
      console.log('Начинаем выход...');
      await logout();
      console.log('Выход выполнен, перенаправляем...');
      toast.success('Выход выполнен успешно');
      
      // Принудительное перенаправление на страницу авторизации
      navigate('/authorization', { replace: true });
      
      // Дополнительная проверка через небольшую задержку
      setTimeout(() => {
        if (window.location.pathname !== '/authorization') {
          console.log('Принудительное перенаправление на авторизацию...');
          window.location.href = '/authorization';
        }
      }, 100);
    } catch (error) {
      console.error('Ошибка при выходе:', error);
      toast.error('Ошибка при выходе');
    }
  };

  return (
    <div className="wrapper">
      <AppBar 
        position="static" 
        sx={{ 
          background: 'linear-gradient(45deg, #667eea 0%, #764ba2 100%)',
          boxShadow: '0 4px 20px rgba(102, 126, 234, 0.3)'
        }}
      >
        <Toolbar>
          <Typography 
            variant="h6" 
            component="div" 
            sx={{ 
              flexGrow: 1,
              fontWeight: 'bold',
              fontSize: '1.5rem'
            }}
          >
            GigaWin 2025
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {user && (
              <>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AccountCircle sx={{ color: 'white' }} />
                  <Typography variant="body2" sx={{ color: 'white' }}>
                    {user.full_name || user.email}
                  </Typography>
                  {user.role === 'admin' && (
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        color: '#ffd700', 
                        fontWeight: 'bold',
                        backgroundColor: 'rgba(255, 215, 0, 0.2)',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        fontSize: '0.7rem'
                      }}
                    >
                      ADMIN
                    </Typography>
                  )}
                </Box>
                
                <IconButton
                  color="inherit"
                  onClick={handleLogout}
                  sx={{
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    }
                  }}
                >
                  <Logout />
                </IconButton>
              </>
            )}
          </Box>
        </Toolbar>
      </AppBar>
      
      <main>
        <Outlet/>
      </main>
    </div>
  )
}

