// @ts-nocheck
// components/settings-panel/settings-panel.tsx
import { FC, useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
} from '@mui/material';
import { 
  Close as CloseIcon, 
  CheckCircle as SuccessIcon,
  Error as ErrorIcon 
} from '@mui/icons-material';
import { useAlertParameters } from '../../shared/hooks/use-alerts-parameters/useAlertParameters';


export const SettingsPanel: FC = () => {
  const { parameters, isLoading, error, updateParameters, isUpdating } = useAlertParameters();
  const [formValues, setFormValues] = useState<{
    pump_cavitation_multiplier?: number | string;
    small_leakage_excedents_threshold?: number | string;
  }>({});
  
  const [notification, setNotification] = useState<{
    open: boolean;
    type: 'success' | 'error';
    message: string;
  }>({
    open: false,
    type: 'success',
    message: '',
  });

  const handleInputChange = (key: string, value: string) => {
    // Разрешаем пустую строку для удобства редактирования
    if (value === '') {
      setFormValues(prev => ({ ...prev, [key]: '' }));
      return;
    }
    
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      setFormValues(prev => ({ ...prev, [key]: numValue }));
    }
  };

  const handleSubmit = async () => {
    try {
      // Преобразуем строковые значения обратно в числа перед отправкой
      const submitValues: any = {};
      
      if (typeof formValues.pump_cavitation_multiplier === 'number') {
        submitValues.pump_cavitation_multiplier = formValues.pump_cavitation_multiplier;
      } else if (formValues.pump_cavitation_multiplier !== '') {
        // Если значение не пустое, но не число - используем значение из параметров
        submitValues.pump_cavitation_multiplier = parameters?.pump_cavitation_multiplier.value;
      }
      
      if (typeof formValues.small_leakage_excedents_threshold === 'number') {
        submitValues.small_leakage_excedents_threshold = formValues.small_leakage_excedents_threshold;
      } else if (formValues.small_leakage_excedents_threshold !== '') {
        submitValues.small_leakage_excedents_threshold = parameters?.small_leakage_excedents_threshold.value;
      }
      
      // Проверяем, есть ли что отправлять
      if (Object.keys(submitValues).length > 0) {
        await updateParameters(submitValues);
        setNotification({
          open: true,
          type: 'success',
          message: 'Параметры успешно обновлены!',
        });
      } else {
        setNotification({
          open: true,
          type: 'error',
          message: 'Нет данных для обновления',
        });
      }
    } catch (err) {
      setNotification({
        open: true,
        type: 'error',
        message: `Ошибка при обновлении параметров: ${err.message}`,
      });
    }
  };

  const handleReset = () => {
    if (parameters) {
      setFormValues({
        pump_cavitation_multiplier: parameters.pump_cavitation_multiplier.value,
        small_leakage_excedents_threshold: parameters.small_leakage_excedents_threshold.value,
      });
    }
  };

  const handleCloseNotification = () => {
    setNotification(prev => ({ ...prev, open: false }));
  };

  // Получаем отображаемое значение для инпута
  const getDisplayValue = (key: string): string => {
    const value = formValues[key as keyof typeof formValues];
    if (value === undefined && parameters) {
      // Если значение не установлено, берем из параметров
      return parameters[key as keyof typeof parameters].value.toString();
    }
    return value?.toString() || '';
  };

  // Инициализация формы при загрузке параметров
  useEffect(() => {
    if (parameters && Object.keys(formValues).length === 0) {
      setFormValues({
        pump_cavitation_multiplier: parameters.pump_cavitation_multiplier.value,
        small_leakage_excedents_threshold: parameters.small_leakage_excedents_threshold.value,
      });
    }
  }, [parameters, formValues]);

  // Автоматическое закрытие успешного уведомления через 3 секунды
  useEffect(() => {
    if (notification.open && notification.type === 'success') {
      const timer = setTimeout(() => {
        handleCloseNotification();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [notification.open, notification.type]);
  
  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error">
        Ошибка загрузки параметров: {error.message}
      </Alert>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
        Настройки параметров алертов
      </Typography>
      
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Настройте параметры для системы оповещений о событиях в водоснабжении
      </Typography>

      {parameters && (
        <Box component="form" sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Pump Cavitation Multiplier */}
          <Paper elevation={2} sx={{ p: 2 }}>
            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
              Множитель кавитации насоса
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {parameters.pump_cavitation_multiplier.description}
            </Typography>
            <TextField
              fullWidth
              type="number"
              label="Значение множителя"
              value={getDisplayValue('pump_cavitation_multiplier')}
              onChange={(e) => handleInputChange('pump_cavitation_multiplier', e.target.value)}
              inputProps={{
                min: parameters.pump_cavitation_multiplier.range.min,
                max: parameters.pump_cavitation_multiplier.range.max,
                step: 0.1,
              }}
              helperText={`Диапазон: ${parameters.pump_cavitation_multiplier.range.min} - ${parameters.pump_cavitation_multiplier.range.max}`}
            />
          </Paper>
              
          {/* Small Leakage Threshold */}
          <Paper elevation={2} sx={{ p: 2 }}>
            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
              Порог обнаружения малых утечек
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {parameters.small_leakage_excedents_threshold.description}
            </Typography>
            <TextField
              fullWidth
              type="number"
              label="Пороговое значение"
              value={getDisplayValue('small_leakage_excedents_threshold')}
              onChange={(e) => handleInputChange('small_leakage_excedents_threshold', e.target.value)}
              inputProps={{
                min: parameters.small_leakage_excedents_threshold.range.min,
                max: parameters.small_leakage_excedents_threshold.range.max,
                step: 0.1,
              }}
              helperText={`Диапазон: ${parameters.small_leakage_excedents_threshold.range.min} - ${parameters.small_leakage_excedents_threshold.range.max}`}
            />
          </Paper>

          <Divider />

          {/* Actions */}
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            <Button 
              variant="outlined" 
              onClick={handleReset}
              disabled={isUpdating}
            >
              Сбросить
            </Button>
            <Button 
              variant="contained" 
              onClick={handleSubmit}
              disabled={isUpdating}
              startIcon={isUpdating ? <CircularProgress size={16} /> : null}
            >
              {isUpdating ? 'Сохранение...' : 'Сохранить'}
            </Button>
          </Box>
        </Box>
      )}

        {/* Улучшенное модальное окно уведомления */}
      <Dialog
        open={notification.open}
        onClose={handleCloseNotification}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: '0px 12px 32px rgba(0, 0, 0, 0.15)',
            overflow: 'hidden',
          }
        }}
      >
        <DialogTitle sx={{ 
          m: 0, 
          p: 3, 
          display: 'flex', 
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: notification.type === 'success' ? 
            'linear-gradient(135deg, #4caf50 0%, #66bb6a 100%)' : 
            'linear-gradient(135deg, #f44336 0%, #ef5350 100%)',
          color: 'white',
          textAlign: 'center',
          position: 'relative'
        }}>
          {/* <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center',
            gap: 1
          }}>
            {notification.type === 'success' ? (
              <SuccessIcon sx={{ fontSize: 48, opacity: 0.9 }} />
            ) : (
              <ErrorIcon sx={{ fontSize: 48, opacity: 0.9 }} />
            )}
            <Typography variant="h5" component="div" sx={{ fontWeight: 'bold', mt: 1 }}>
              {notification.type === 'success' ? 'Успешно!' : 'Ошибка'}
            </Typography>
          </Box> */}
          
          <IconButton
            aria-label="close"
            onClick={handleCloseNotification}
            sx={{
              color: 'white',
              position: 'absolute',
              right: 12,
              top: 12,
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.3)',
              }
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        
        <DialogContent sx={{ p: 4, textAlign: 'center' }}>
          <Typography 
            variant="body1" 
            sx={{ 
              fontSize: '1.1rem',
              lineHeight: 1.6,
              color: 'text.primary'
            }}
          >
            {notification.message}
          </Typography>
        </DialogContent>
        
        <DialogActions sx={{ 
          p: 3, 
          gap: 2, 
          justifyContent: 'center',
          borderTop: '1px solid',
          borderColor: 'divider'
        }}>
          {notification.type === 'error' && (
            <Button 
              onClick={handleCloseNotification}
              variant="outlined"
              size="large"
              sx={{ 
                minWidth: 120,
                borderColor: 'primary.main',
                color: 'primary.main',
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 'bold',
                '&:hover': {
                  borderColor: 'primary.dark',
                  backgroundColor: 'primary.light',
                }
              }}
            >
              Закрыть
            </Button>
          )}
          {notification.type === 'success' && (
            <Button 
              onClick={handleCloseNotification}
              variant="contained"
              size="large"
              sx={{ 
                minWidth: 120,
                backgroundColor: 'primary.main',
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 'bold',
                '&:hover': {
                  backgroundColor: 'primary.dark',
                }
              }}
            >
              Отлично!
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};