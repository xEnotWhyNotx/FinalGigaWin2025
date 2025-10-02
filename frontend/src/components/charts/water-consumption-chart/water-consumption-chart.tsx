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
  console.log('WaterConsumptionChart data:', data); // Для отладки

  if (!data || !data.timestamp || data.timestamp.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100%">
        <Typography variant="body2" color="text.secondary">
          Нет данных для отображения
        </Typography>
      </Box>
    );
  }

  // Проверяем, что все массивы имеют одинаковую длину
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
    // МЕНЯЕМ МЕСТАМИ: теперь predicted становится "Факт", а real становится "Прогноз"
    Факт: data.predicted[index], // бывший predicted
    Прогноз: data.real[index],   // бывший real
    // Форматируем время - берем только часы
    time: new Date(timestamp.replace(' ', 'T')).getHours().toString().padStart(2, '0'),
  }));

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
          <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="time"
              label={{ value: 'Время, ч', position: 'insideBottom', offset: 0 }}
            />
            <YAxis 
              label={{ value: 'Расход, м³/ч', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip 
              formatter={(value: number) => [`${value.toFixed(2)} м³/ч`, '']}
              labelFormatter={(label) => `Время: ${label}:00`}
            />
            <Legend verticalAlign="top" height={36}/>
            {/* Теперь "Прогноз" использует данные из data.real */}
            <Line
              type="monotone"
              dataKey="Прогноз"
              stroke="#82ca9d"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
            {/* Теперь "Факт" использует данные из data.predicted */}
            <Line
              type="monotone"
              dataKey="Факт"
              stroke="#8884d8"
              strokeWidth={2}
              dot={{ fill: '#8884d8', strokeWidth: 1, r: 2 }}
              activeDot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </Box>
    </Box>
  );
};