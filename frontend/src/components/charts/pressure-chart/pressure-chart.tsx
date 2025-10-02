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
  Legend,
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
          <ComposedChart margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
            <XAxis 
              dataKey="consumption"
              type="number"
              label={{ value: 'Расход, м³/ч', position: 'insideBottom', offset: -5 }}
              domain={[0, 'dataMax + 50']}
            />
            <YAxis 
              label={{ value: 'Напор, м вод. ст.', angle: -90, position: 'insideLeft' }}
              domain={[0, 'dataMax + 10']}
            />
            <Tooltip 
              formatter={(value: number, name: string) => {
                const unit = name === 'pressure' ? ' м вод. ст.' : ' м³/ч';
                const label = name === 'pressure' ? 'Напор' : 'Расход';
                return [`${value.toFixed(2)}${unit}`, label];
              }}
            />
            <Legend />
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