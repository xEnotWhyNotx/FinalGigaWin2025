// components/charts/water-consumption-chart.tsx
import { Box, Typography, Paper, Stack } from '@mui/material';
import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface WaterConsumptionChartProps {
  data: any; // Принимаем любые данные
  showPrediction?: boolean;
}

export const WaterConsumptionChart: React.FC<WaterConsumptionChartProps> = ({ 
  data, 
  showPrediction = false 
}) => {
  console.log('WaterConsumptionChart data:', data);
  console.log('showPrediction:', showPrediction);

  // Функция для преобразования данных в единый формат
  const transformData = () => {
    if (!data) return [];

    // Если данные в формате для домов: {predicted: [], real: [], timestamp: []}
    if (data.predicted && data.real && data.timestamp && 
        Array.isArray(data.predicted) && 
        Array.isArray(data.real) && 
        Array.isArray(data.timestamp)) {
      
      return data.timestamp.map((timestamp: string, index: number) => ({
        timestamp,
        Факт: data.real[index] || 0,
        Прогноз: data.predicted[index] || 0,
        time: new Date(timestamp.replace(' ', 'T')).getHours().toString().padStart(2, '0'),
      }));
    }

    // Если данные в формате массива для ЦТП: Array<{timestamp: string, consumption: number}>
    if (Array.isArray(data)) {
      return data.map((item: any) => ({
        timestamp: item.timestamp,
        Факт: item.consumption || 0,
        Прогноз: item.predicted || 0,
        time: item.timestamp ? new Date(item.timestamp.replace(' ', 'T')).getHours().toString().padStart(2, '0') : '00'
      }));
    }

    // Если данные в другом формате, пытаемся адаптировать
    console.warn('Unknown data format:', data);
    return [];
  };

  const chartData = transformData();

  if (!chartData || chartData.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100%">
        <Typography variant="body2" color="text.secondary">
          Нет данных для отображения
        </Typography>
      </Box>
    );
  }

  // Расчет статистик
  const currentConsumption = chartData[chartData.length - 1]?.Факт || 0;
  const averageConsumption = chartData.reduce((sum: number, item: any) => sum + item.Факт, 0) / chartData.length;
  const maxConsumption = Math.max(...chartData.map((item: any) => item.Факт));

  // Проверяем, есть ли данные для прогноза
  const hasPredictionData = chartData.some((item: any) => item.Прогноз && item.Прогноз > 0);
  const shouldShowPrediction = showPrediction && hasPredictionData;

  // Кастомный тултип
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <Paper sx={{ p: 2, bgcolor: 'background.paper', border: 1, borderColor: 'divider' }}>
          <Typography variant="subtitle2" gutterBottom>
            🕒 Время: <strong>{label}:00</strong>
          </Typography>
          {payload.map((entry: any, index: number) => (
            <Typography 
              key={index} 
              variant="body2" 
              sx={{ color: entry.color }}
            >
              {entry.name === 'Факт' && '📊 '}
              {entry.name === 'Прогноз' && '🔮 '}
              <strong>{entry.name}:</strong> {entry.value?.toFixed(1) || '0'} м³/ч
            </Typography>
          ))}
        </Paper>
      );
    }
    return null;
  };

  return (
    <Box sx={{ height: '100%' }}>
      <Paper sx={{ 
        p: 1, 
        mb: 1, 
        bgcolor: shouldShowPrediction ? 'primary.light' : 'secondary.light', 
        color: 'white' 
      }}>
        <Stack direction="row" spacing={3} justifyContent="center">
          <Typography variant="subtitle1">
            📊 Текущий: <strong>{currentConsumption.toFixed(1)} м³/ч</strong>
          </Typography>
          <Typography variant="subtitle1">
            📈 Средний: <strong>{averageConsumption.toFixed(1)} м³/ч</strong>
          </Typography>
          <Typography variant="subtitle1">
            🚀 Максимум: <strong>{maxConsumption.toFixed(1)} м³/ч</strong>
          </Typography>
          {shouldShowPrediction && (
            <Typography variant="subtitle1">
              🔮 Прогноз: <strong>{chartData[chartData.length - 1]?.Прогноз?.toFixed(1) || '0'} м³/ч</strong>
            </Typography>
          )}
        </Stack>
      </Paper>
      
      <Box sx={{ height: 'calc(100% - 60px)' }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 40 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="time"
              label={{ value: 'Время, ч', position: 'insideBottom', offset: 0 }}
            />
            <YAxis 
              label={{ value: 'Расход, м³/ч', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend verticalAlign="top" height={36}/>
            
            {/* Линия фактического расхода */}
            <Line
              type="monotone"
              dataKey="Факт"
              stroke="#82ca9d"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
            
            {/* Линия прогноза (показываем только если включено и есть данные) */}
            {shouldShowPrediction && (
              <Line
                type="monotone"
                dataKey="Прогноз"
                stroke="#8884d8"
                strokeWidth={2}
                dot={{ fill: '#8884d8', strokeWidth: 1, r: 2 }}
                activeDot={{ r: 4 }}
                strokeDasharray="3 3"
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </Box>
    </Box>
  );
};