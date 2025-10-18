// components/charts/pressure-chart.tsx
import React from 'react';
import { Box, Typography, Paper, Stack } from '@mui/material';
import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Scatter,
} from 'recharts';

interface PressureData {
  pump_curve: {
    pump_consumption: number[];
    pump_pressure: number[];
  };
  pipe_curve: {
    pipe_consumption: number[];
    pipe_pressure: number[];
  };
  current_state: {
    consumption: number;
    pressure: number;
  };
}

interface PressureChartProps {
  data: PressureData;
}

export const PressureChart: React.FC<PressureChartProps> = ({ data }) => {
  if (!data) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100%">
        <Typography variant="body2" color="text.secondary">
          Нет данных для отображения
        </Typography>
      </Box>
    );
  }

  const { current_state, pump_curve, pipe_curve } = data;

  // Данные для насоса
  const pumpData = pump_curve.pump_consumption.map((consumption, index) => ({
    consumption,
    pressure: pump_curve.pump_pressure[index],
    type: 'pump',
  }));

  // Данные для трубы
  const pipeData = pipe_curve.pipe_consumption.map((consumption, index) => ({
    consumption,
    pressure: pipe_curve.pipe_pressure[index],
    type: 'pipe',
  }));

  // Текущая точка
  const currentPoint = [{
    consumption: current_state.consumption,
    pressure: current_state.pressure,
    type: 'current',
  }];

  // Кастомный тултип для PressureChart
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <Paper sx={{ p: 2, bgcolor: 'background.paper', border: 1, borderColor: 'divider' }}>
          <Typography variant="subtitle2" gutterBottom>
            📊 Расход: <strong>{label.toFixed(1)} м³/ч</strong>
          </Typography>
          {payload.map((entry: any, index: number) => (
            <Typography 
              key={index} 
              variant="body2" 
              sx={{ color: entry.color }}
            >
              {entry.name === 'Насос' && '💧 '}
              {entry.name === 'Труба' && '📈 '}
              {entry.name === 'Текущее состояние' && '⚡ '}
              <strong>{entry.name}:</strong> {entry.value.toFixed(1)} м вод. ст.
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
            💧 Напор: <strong>{current_state.pressure.toFixed(1)} м вод. ст.</strong>
          </Typography>
          <Typography variant="subtitle1">
            📊 Расход: <strong>{current_state.consumption.toFixed(1)} м³/ч</strong>
          </Typography>
        </Stack>
      </Paper>

      <Box sx={{ height: 'calc(100% - 60px)' }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart margin={{ top: 20, right: 20, left: 20, bottom: 40 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
            <XAxis 
              dataKey="consumption"
              type="number"
              label={{ 
                value: 'Расход, м³/ч', 
                position: 'insideBottom',
                offset: 0,
                style: { transform: 'translateY(10px)' } 
              }}
              domain={[0, 'dataMax + 50']}
            />
            <YAxis 
              label={{ 
                value: 'Напор, м вод. ст.', 
                angle: -90, 
                position: 'insideLeft',
              }}
              domain={[0, 'dataMax + 10']}
            />
            <Tooltip content={<CustomTooltip />} />
            {/* Убрал Legend */}
            {/* Кривая насоса */}
            <Line
              data={pumpData}
              dataKey="pressure"
              stroke="#8884d8"
              strokeWidth={3}
              name="Насос"
              dot={false}
              isAnimationActive={false}
            />
            {/* Кривая трубы */}
            <Line
              data={pipeData}
              dataKey="pressure"
              stroke="#82ca9d"
              strokeWidth={3}
              name="Труба"
              dot={false}
              isAnimationActive={false}
            />
            {/* Рабочая точка */}
            <Scatter
              data={currentPoint}
              dataKey="pressure"
              fill="#ff7300"
              name="Текущее состояние"
              r={8}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </Box>
    </Box>
  );
};