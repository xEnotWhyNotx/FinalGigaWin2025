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
  data: {
    predicted: number[];
    real: number[];
    timestamp: string[];
  };
}

export const WaterConsumptionChart: React.FC<WaterConsumptionChartProps> = ({ data }) => {
  console.log('WaterConsumptionChart data:', data);

  if (!data || !data.timestamp || data.timestamp.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100%">
        <Typography variant="body2" color="text.secondary">
          Нет данных для отображения
        </Typography>
      </Box>
    );
  }

  const isValidData = data.predicted && data.real && data.timestamp && 
                     data.predicted.length === data.real.length && 
                     data.real.length === data.timestamp.length;

  if (!isValidData) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100%">
        <Typography variant="body2" color="text.secondary">
          Неверный формат данных
        </Typography>
      </Box>
    );
  }

  const lastIndex = data.timestamp.length - 1;
  const currentConsumption = data.real[lastIndex];

  const chartData = data.timestamp.map((timestamp, index) => ({
    timestamp,
    Факт: data.real[index],
    Прогноз: data.predicted[index],
    time: new Date(timestamp.replace(' ', 'T')).getHours().toString().padStart(2, '0'),
  }));

  // Кастомный тултип для WaterConsumptionChart
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
              <strong>{entry.name}:</strong> {entry.value.toFixed(1)} м³/ч
            </Typography>
          ))}
        </Paper>
      );
    }
    return null;
  };

  return (
    <Box sx={{ height: '100%' }}>
      <Paper sx={{ p: 1, mb: 1, bgcolor: 'primary.light', color: 'white' }}>
        <Stack direction="row" spacing={3} justifyContent="center">
          <Typography variant="subtitle1">
            📊 Текущий расход: <strong>{currentConsumption.toFixed(1)} м³/ч</strong>
          </Typography>
          <Typography variant="subtitle1">
            📈 Средний: <strong>{(data.real.reduce((a, b) => a + b, 0) / data.real.length).toFixed(1)} м³/ч</strong>
          </Typography>
        </Stack>
      </Paper>
      
      <Box sx={{ height: 'calc(100% - 60px)' }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 40 }}> {/* Увеличил bottom margin */}
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="time"
              label={{ value: 'Время, ч', position: 'insideBottom', offset: 0, style: { transform: 'translate(0, 10px)' } }}
            />
            <YAxis 
              label={{ value: 'Расход, м³/ч', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend verticalAlign="top" height={36}/>
            <Line
              type="monotone"
              dataKey="Прогноз"
              stroke="#8884d8"
              strokeWidth={2}
              dot={{ fill: '#8884d8', strokeWidth: 1, r: 2 }}
              activeDot={{ r: 4 }}
            />
            <Line
              type="monotone"
              dataKey="Факт"
              stroke="#82ca9d"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </Box>
    </Box>
  );
};