// @ts-nocheck
// components/AlertsList.tsx
import React from 'react';
import {
  Box,
  Paper,
  Typography,
  List,
  ListItem,
  Chip,
  Divider,
  Alert as MuiAlert,
  Stack,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Warning,
  Error as ErrorIcon,
  Info,
  LocationOn,
  Schedule,
} from '@mui/icons-material';
import type { Alert } from '../../shared/types/alert.types';


interface AlertsListProps {
  alerts: Alert[];
  loading: boolean;
  error: string | null;
  onAlertClick?: (alert: Alert) => void;
}

export const AlertsList: React.FC<AlertsListProps> = ({
  alerts,
  loading,
  error,
  onAlertClick,
}) => {
  const getSeverityIcon = (severity: Alert['severity']) => {
    switch (severity) {
      case 'high':
        return <ErrorIcon color="error" />;
      case 'medium':
        return <Warning color="warning" />;
      case 'low':
        return <Info color="info" />;
      default:
        return <Info color="info" />;
    }
  };

  const getSeverityColor = (severity: Alert['severity']) => {
    switch (severity) {
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      case 'low':
        return 'info';
      default:
        return 'info';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('ru-RU');
  };

  if (error) {
    return (
      <MuiAlert severity="error" sx={{ mb: 2 }}>
        {error}
      </MuiAlert>
    );
  }

  if (loading) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography>Загрузка алертов...</Typography>
      </Box>
    );
  }

  if (alerts.length === 0) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="text.secondary">
          Алерты не найдены
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper>
      <Box sx={{ p: 2 }}>
        <Typography variant="h6">
          Алерты ({alerts.length})
        </Typography>
      </Box>
      
      <Divider />
      
      <List sx={{ maxHeight: 400, overflow: 'auto' }}>
        {alerts.map((alert, index) => (
          <React.Fragment key={alert.id}>
            <ListItem
              sx={{
                py: 2,
                cursor: onAlertClick ? 'pointer' : 'default',
                '&:hover': onAlertClick ? {
                  backgroundColor: 'action.hover',
                } : {},
              }}
              onClick={() => onAlertClick?.(alert)}
            >
              <Stack spacing={1} sx={{ width: '100%' }}>
                {/* Заголовок */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {getSeverityIcon(alert.severity)}
                  <Typography variant="subtitle1" sx={{ flex: 1 }}>
                    {alert.event_type}
                  </Typography>
                  <Chip
                    label={alert.severity}
                    color={getSeverityColor(alert.severity)}
                    size="small"
                  />
                </Box>

                {/* Описание */}
                <Typography variant="body2" color="text.secondary">
                  {alert.description}
                </Typography>

                {/* Детали */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                  <Tooltip title="ЦТП">
                    <Chip
                      icon={<LocationOn />}
                      label={`ЦТП: ${alert.ctp}`}
                      variant="outlined"
                      size="small"
                    />
                  </Tooltip>
                  
                  <Tooltip title="Дом">
                    <Chip
                      label={`UNOM: ${alert.unom}`}
                      variant="outlined"
                      size="small"
                    />
                  </Tooltip>

                  {alert.duration_hours && (
                    <Tooltip title="Длительность">
                      <Chip
                        icon={<Schedule />}
                        label={`${alert.duration_hours}ч`}
                        variant="outlined"
                        size="small"
                      />
                    </Tooltip>
                  )}
                </Box>

                {/* Временная метка */}
                <Typography variant="caption" color="text.secondary">
                  {formatTimestamp(alert.timestamp)}
                </Typography>
              </Stack>
            </ListItem>
            
            {index < alerts.length - 1 && <Divider />}
          </React.Fragment>
        ))}
      </List>
    </Paper>
  );
};