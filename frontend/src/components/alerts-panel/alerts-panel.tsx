// @ts-nocheck
import React, { useState } from 'react';
import { 
  Box, Typography, IconButton, 
  Button, Stack, Alert as MuiAlert, CircularProgress,
  Chip, Paper, Avatar, List, ListItem, ListItemAvatar, ListItemText,
  FormControlLabel, Switch,
  Dialog, DialogTitle, DialogContent, DialogActions, DialogContentText
} from '@mui/material';
import { 
  Warning, 
  Refresh, 
  Error as ErrorIcon,
  LocalFireDepartment,
  Schedule,
  Place,
  FilterList,
  CheckCircle
} from '@mui/icons-material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ru } from 'date-fns/locale';
import { useDispatch, useSelector } from 'react-redux';

import { useAlerts } from '../../shared/hooks/use-alerts/use-alerts';
import type { Alert, AlertFilters } from '../../shared/types/alert.types';
import { getTimeAgo } from './alerts-panel.util';
import type { RootState } from '../../shared/store';
import { toggleFilterByAlerts } from '../../shared/slices/alertsSlice';

interface AlertsPanelProps {
  defaultExpanded?: boolean;
  onAlertClick?: (alert: Alert) => void;
}

const alertWorkTimeVariableForUseState = "2025-09-07T10:00:00"

export const AlertsPanel: React.FC<AlertsPanelProps> = ({
  defaultExpanded = true,
  onAlertClick,
}) => {
  const dispatch = useDispatch();
  const { filterByAlerts } = useSelector((state: RootState) => state.alerts);
  
  const [selectedDateTime, setSelectedDateTime] = useState<Date>(new Date(''));
  const [filters, setFilters] = useState<AlertFilters>({
    timestamp: '',
  });

  // Состояния для модалок
  const [openSendTeam, setOpenSendTeam] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);

  // Обновляем фильтры при изменении даты
  const handleDateTimeChange = (date: Date | null) => {
    console.log(date, "date from mui")
    if (date) {
      setSelectedDateTime(date);
      
      // Форматируем вручную без использования toISOString()
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const seconds = String(date.getSeconds()).padStart(2, '0');
      
      const formattedTimestamp = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
      
      setFilters(prev => ({ 
        ...prev, 
        timestamp: formattedTimestamp 
      }));
    }
  };

  // Передаем filters объект, а не строку
  const { 
    data: alerts = [], 
    isLoading, 
    error, 
    refetch,
    isFetching 
  } = useAlerts(filters);

  // Обработчик переключения фильтра
  const handleFilterToggle = () => {
    dispatch(toggleFilterByAlerts());
  };

  console.log(alerts, 'hello')

  // Обработчики модалок
  const handleOpenSendTeam = (alert: Alert) => {
    setSelectedAlert(alert);
    setOpenSendTeam(true);
  };
  
  const handleCloseSendTeam = () => {
    setOpenSendTeam(false);
    setSelectedAlert(null);
  };

  // Статистика по приоритетам
  const highPriorityCount = alerts.filter(alert => 
    alert.level?.includes('Высокий') || alert.severity === 'high'
  ).length;
  
  const mediumPriorityCount = alerts.filter(alert => 
    alert.level?.includes('Средний') || alert.severity === 'medium'
  ).length;

  const lowPriorityCount = alerts.filter(alert => 
    !alert.level?.includes('Высокий') && !alert.level?.includes('Средний') && alert.severity !== 'high' && alert.severity !== 'medium'
  ).length;

  const handleRefresh = () => {
    refetch();
  };

  const getSeverityColor = (alert: Alert) => {
    if (alert.level?.includes('Высокий') || alert.severity === 'high') return 'error';
    if (alert.level?.includes('Средний') || alert.severity === 'medium') return 'warning';
    return 'info';
  };

  const getSeverityAvatar = (alert: Alert) => {
    const color = getSeverityColor(alert);
    const bgColor = {
      error: '#ff4444',
      warning: '#ffaa00',
      info: '#0099cc'
    }[color];

    return (
      <Avatar sx={{ bgcolor: bgColor, width: 32, height: 32 }}>
        <Warning sx={{ fontSize: 18 }} />
      </Avatar>
    );
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ru}>
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', padding: '16px' }}>
        {/* Заголовок с статистикой */}
        <Paper 
          elevation={0}
          sx={{ 
            p: 2, 
            bgcolor: 'primary.main', 
            color: 'white',
            borderBottom: '1px solid',
            borderColor: 'divider'
          }}
        >
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Box display="flex" alignItems="center" gap={1.5}>
              <LocalFireDepartment sx={{ fontSize: 28 }} />
              <Box>
                <Typography variant="h6" fontWeight="bold">
                  Система алертов
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.9 }}>
                  Активные уведомления
                </Typography>
              </Box>
            </Box>
            
            <IconButton 
              size="small" 
              sx={{ color: 'white' }}
              onClick={handleRefresh}
              disabled={isFetching}
            >
              <Refresh sx={{ fontSize: 20 }} />
            </IconButton>
          </Box>

          {/* Статистика */}
          <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
            <Box textAlign="center">
              <Chip 
                label={highPriorityCount} 
                size="small" 
                color="error"
                sx={{ color: 'white', fontWeight: 'bold', minWidth: 40 }}
              />
              <Typography variant="caption" display="block" sx={{ mt: 0.5, opacity: 0.9 }}>
                Высокие
              </Typography>
            </Box>
            
            <Box textAlign="center">
              <Chip 
                label={mediumPriorityCount} 
                size="small" 
                color="warning"
                sx={{ color: 'white', fontWeight: 'bold', minWidth: 40 }}
              />
              <Typography variant="caption" display="block" sx={{ mt: 0.5, opacity: 0.9 }}>
                Средние
              </Typography>
            </Box>
            
            <Box textAlign="center">
              <Chip 
                label={lowPriorityCount} 
                size="small" 
                color="info"
                sx={{ color: 'white', fontWeight: 'bold', minWidth: 40 }}
              />
              <Typography variant="caption" display="block" sx={{ mt: 0.5, opacity: 0.9 }}>
                Низкие
              </Typography>
            </Box>
          </Stack>
        </Paper>

        {/* Выбор даты и времени */}
        <Paper elevation={0} sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
            Выберите дату и время:
          </Typography>
          <DateTimePicker
            value={selectedDateTime}
            onChange={handleDateTimeChange}
            ampm={false}
            format="dd.MM.yyyy HH:00" // Фиксируем минуты как 00
            minutesStep={60} // Шаг в 60 минут (отключает выбор минут)
            slotProps={{
              textField: {
                fullWidth: true,
                size: "small",
                placeholder: "Выберите дату и время",
              },
            }}
          />
        </Paper>

        {/* Переключатель фильтрации */}
        <Paper elevation={0} sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
          <FormControlLabel
            control={
              <Switch
                checked={filterByAlerts}
                onChange={handleFilterToggle}
                color="primary"
              />
            }
            label={
              <Box display="flex" alignItems="center" gap={1}>
                <FilterList fontSize="small" />
                <Typography variant="subtitle2">
                  Фильтровать объекты по алертам
                </Typography>
              </Box>
            }
          />
          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
            {filterByAlerts 
              ? 'Показываются только объекты с алертами' 
              : 'Показываются все объекты'
            }
          </Typography>
        </Paper>

        {/* Контент */}
        <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
          {/* Состояния загрузки */}
          {isLoading && (
            <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" py={6}>
              <CircularProgress size={48} />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                Загрузка алертов...
              </Typography>
            </Box>
          )}

          {/* Ошибка */}
          {error && (
            <MuiAlert 
              severity="error" 
              icon={<ErrorIcon />}
              sx={{ mb: 2 }}
              action={
                <Button color="inherit" size="small" onClick={handleRefresh}>
                  Повторить
                </Button>
              }
            >
              Ошибка загрузки данных
            </MuiAlert>
          )}

          {/* Список алертов */}
          {!isLoading && !error && (
            <List sx={{ py: 0 }}>
              {alerts.map((alert, index) => (
                <ListItem
                  key={alert.id || alert.object_id}
                  alignItems="flex-start"
                  sx={{
                    cursor: onAlertClick ? 'pointer' : 'default',
                    borderRadius: 2,
                    mb: 1,
                    transition: 'all 0.2s ease',
                    '&:hover': onAlertClick ? { 
                      bgcolor: 'action.hover', 
                      transform: 'translateY(-1px)',
                      boxShadow: 1
                    } : {},
                    borderLeft: `4px solid ${
                      getSeverityColor(alert) === 'error' ? '#f44336' : 
                      getSeverityColor(alert) === 'warning' ? '#ff9800' : '#2196f3'
                    }`
                  }}
                  onClick={() => onAlertClick?.(alert)}
                >
                  <ListItemAvatar>
                    {getSeverityAvatar(alert)}
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                        <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 0.5, flex: 1 }}>
                          {alert.alert_message || 'Нет описания'}
                        </Typography>
                        <Button
                          variant="contained"
                          color="primary"
                          size="small"
                          startIcon={<Warning sx={{ fontSize: 16 }} />}
                          onClick={(e) => {
                            e.stopPropagation(); // Предотвращаем всплытие события
                            handleOpenSendTeam(alert);
                          }}
                          sx={{ 
                            ml: 1,
                            minWidth: 'auto',
                            px: 1,
                            fontSize: '0.75rem'
                          }}
                        >
                          Бригада
                        </Button>
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }} flexWrap="wrap">
                          <Chip 
                            label={alert.level || 'Не указан'} 
                            size="small" 
                            color={getSeverityColor(alert) as any}
                            variant="outlined"
                          />
                          {alert.object_id && (
                            <Box display="flex" alignItems="center" gap={0.5}>
                              <Place sx={{ fontSize: 14, color: 'text.secondary' }} />
                              <Typography variant="caption" color="text.secondary">
                                {alert.object_id}
                              </Typography>
                            </Box>
                          )}
                        </Stack>
                        
                        {alert.comment && (
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            {alert.comment}
                          </Typography>
                        )}
                        
                        <Box display="flex" alignItems="center" gap={1}>
                          <Schedule sx={{ fontSize: 14, color: 'text.secondary' }} />
                          <Typography variant="caption" color="text.secondary">
                            {getTimeAgo(alert.timestamp)}
                          </Typography>
                        </Box>
                      </Box>
                    }
                  />
                </ListItem>
              ))}
              
              {alerts.length === 0 && (
                <Box textAlign="center" py={6}>
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    🎉 Нет активных алертов
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Все системы работают нормально
                  </Typography>
                </Box>
              )}
            </List>
          )}
        </Box>

        {/* Убраны общие кнопки действий */}

        {/* Модалка "Отправить бригаду" */}
        <Dialog
          open={openSendTeam}
          onClose={handleCloseSendTeam}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Warning color="primary" />
            Отправка бригады
          </DialogTitle>
          <DialogContent>
            <DialogContentText>
              {selectedAlert ? (
                <>
                  Запрос на отправку бригады для алерта успешно отправлен. 
                  <br /><br />
                  <strong>Объект:</strong> {selectedAlert.object_id}
                  <br />
                  <strong>Проблема:</strong> {selectedAlert.alert_message}
                  <br /><br />
                  Бригада будет направлена к объекту в ближайшее время.
                </>
              ) : (
                'Запрос на отправку бригады успешно отправлен. Бригада будет направлена к объекту в ближайшее время.'
              )}
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseSendTeam} variant="contained">
              Понятно
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
};