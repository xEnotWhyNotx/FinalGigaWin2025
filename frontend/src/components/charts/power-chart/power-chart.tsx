// components/charts/power-chart.tsx
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

interface PowerData {
  pump_curve: {
    pump_consumption: number[];
    pump_power: number[];
  };
  current_state: {
    consumption: number;
    power: number;
  };
}

interface PowerChartProps {
  data: PowerData;
}

export const PowerChart: React.FC<PowerChartProps> = ({ data }) => {
  console.log('PowerChart data:', data); // Для отладки

  if (!data || !data.pump_curve || !data.current_state) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100%">
        <Typography variant="body2" color="text.secondary">
          Нет данных для отображения
        </Typography>
      </Box>
    );
  }

  const { current_state, pump_curve } = data;

  const pumpData = pump_curve.pump_consumption.map((consumption, index) => ({
    consumption,
    power: pump_curve.pump_power[index],
  }));

  const currentPoint = [{
    consumption: current_state.consumption,
    power: current_state.power,
    name: 'Текущее состояние',
  }];

  return (
    <Box sx={{ height: '100%' }}>
      <Paper sx={{ p: 1, mb: 1, bgcolor: 'warning.light', color: 'white' }}>
        <Stack direction="row" spacing={3} justifyContent="center">
          <Typography variant="subtitle1">
            ⚡ Мощность: <strong>{current_state.power.toFixed(1)} кВт</strong>
          </Typography>
          <Typography variant="subtitle1">
            📊 Расход: <strong>{current_state.consumption.toFixed(1)} м³/ч</strong>
          </Typography>
        </Stack>
      </Paper>

      <Box sx={{ height: 'calc(100% - 60px)' }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={pumpData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
            <XAxis 
              dataKey="consumption"
              label={{ value: 'Расход, м³/ч', position: 'insideBottom', offset: -5 }}
              type="number"
            />
            <YAxis 
              label={{ value: 'Мощность, кВт', angle: -90, position: 'insideLeft' }}
              type="number"
            />
            <Tooltip 
              formatter={(value: number, name: string) => {
                if (name === 'power') {
                  return [`${value.toFixed(2)} кВт`, 'Мощность'];
                } else if (name === 'consumption') {
                  return [`${value.toFixed(2)} м³/ч`, 'Расход'];
                }
                return [value, name];
              }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="power"
              stroke="#ff7300"
              strokeWidth={3}
              name="Мощность насоса"
              dot={false}
              activeDot={{ r: 6 }}
            />
            <Scatter
              data={currentPoint}
              dataKey="power"
              fill="#8884d8"
              name="Текущее состояние"
              r={8}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </Box>
    </Box>
  );
};