// @ts-nocheck
// components/ForecastPanel.tsx
import React, { useEffect, useState } from 'react';
import { 
  Box, Paper, Typography, Button, Chip, Stack, 
  CircularProgress, Alert, Select, MenuItem, FormControl, InputLabel 
} from '@mui/material';
import { Refresh, Schedule } from '@mui/icons-material';
import { useForecast } from '../../shared/hooks/use-forecast/use-forecast';
import type { ForecastPeriod } from '../../shared/types/forecast.types';


interface ForecastPanelProps {
  objectId: string;
  objectType: 'ctp' | 'unom';
  onDataUpdate?: (data: any) => void;
}

export const ForecastPanel: React.FC<ForecastPanelProps> = ({
  objectId,
  objectType,
  onDataUpdate
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState<ForecastPeriod>('4h');
  const { 
    getForecast, 
    refreshForecast, 
    getCachedForecast,
    loading, 
    error,
    shouldRefresh 
  } = useForecast();

  const [currentData, setCurrentData] = useState<any>(null);

  const loadForecast = async (period: ForecastPeriod) => {
    try {
      const params = {
        objectId,
        objectType,
        period,
        timestamp: new Date().toISOString()
      };

      const data = await getForecast(params);
      setCurrentData(data);
      onDataUpdate?.(data);
    } catch (err) {
      console.error('Failed to load forecast:', err);
    }
  };

  const handleRefresh = async () => {
    const params = {
      objectId,
      objectType,
      period: selectedPeriod,
      timestamp: new Date().toISOString()
    };
    
    await refreshForecast(params);
    loadForecast(selectedPeriod);
  };

  useEffect(() => {
    loadForecast(selectedPeriod);
  }, [objectId, objectType, selectedPeriod]);

  const periods: ForecastPeriod[] = ['2h', '4h', '6h', '8h', '12h', '24h'];

  return (
    <Paper sx={{ p: 2 }}>
      <Stack spacing={2}>
        {/* Заголовок и управление */}
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="h6">
            Прогноз потребления
          </Typography>
          
          <Box display="flex" alignItems="center" gap={1}>
            <FormControl size="small" sx={{ minWidth: 100 }}>
              <InputLabel>Период</InputLabel>
              <Select
                value={selectedPeriod}
                label="Период"
                onChange={(e) => setSelectedPeriod(e.target.value as ForecastPeriod)}
              >
                {periods.map(period => (
                  <MenuItem key={period} value={period}>
                    {period}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Button
              startIcon={loading ? <CircularProgress size={16} /> : <Refresh />}
              onClick={handleRefresh}
              disabled={loading}
              size="small"
            >
              Обновить
            </Button>
          </Box>
        </Box>

        {/* Статус */}
        {getCachedForecast({ objectId, objectType, period: selectedPeriod, timestamp: '' }) && (
          <Chip 
            icon={<Schedule />}
            label="Данные из кэша"
            size="small"
            color="success"
            variant="outlined"
          />
        )}

        {/* Ошибка */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Данные прогноза */}
        {currentData && (
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Прогнозируемое потребление:
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {currentData.predicted?.length || 0} точек данных
            </Typography>
            <Typography variant="caption" display="block" color="text.secondary">
              Обновлено: {new Date(currentData.lastUpdated).toLocaleTimeString()}
            </Typography>
          </Box>
        )}

        {/* Загрузка */}
        {loading && (
          <Box display="flex" justifyContent="center" py={2}>
            <CircularProgress size={24} />
          </Box>
        )}
      </Stack>
    </Paper>
  );
};