// components/charts/efficiency-chart.tsx
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

interface EfficiencyData {
  pump_curve: {
    pump_consumption: number[];
    pump_kpd: number[];
  };
  current_state: {
    consumption: number;
    kpd: number;
  };
}

interface EfficiencyChartProps {
  data: EfficiencyData;
}

export const EfficiencyChart: React.FC<EfficiencyChartProps> = ({ data }) => {
  console.log('EfficiencyChart data:', data); // Для отладки

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
    kpd: pump_curve.pump_kpd[index],
  }));

  const currentPoint = [{
    consumption: current_state.consumption,
    kpd: current_state.kpd,
    name: 'Текущее состояние',
  }];

  return (
    <Box sx={{ height: '100%' }}>
      <Paper sx={{ p: 1, mb: 1, bgcolor: 'success.light', color: 'white' }}>
        <Stack direction="row" spacing={3} justifyContent="center">
          <Typography variant="subtitle1">
            🔧 КПД: <strong>{current_state.kpd.toFixed(1)} %</strong>
          </Typography>
          <Typography variant="subtitle1">
            📊 Расход: <strong>{current_state.consumption.toFixed(1)} м³/ч</strong>
          </Typography>
          <Typography variant="subtitle1">
            🏆 Макс. КПД: <strong>{Math.max(...pump_curve.pump_kpd).toFixed(1)} %</strong>
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
              label={{ value: 'КПД, %', angle: -90, position: 'insideLeft' }}
              type="number"
            />
            <Tooltip 
              formatter={(value: number, name: string) => {
                if (name === 'kpd') {
                  return [`${value.toFixed(2)} %`, 'КПД'];
                } else if (name === 'consumption') {
                  return [`${value.toFixed(2)} м³/ч`, 'Расход'];
                }
                return [value, name];
              }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="kpd"
              stroke="#82ca9d"
              strokeWidth={3}
              name="КПД насоса"
              dot={false}
              activeDot={{ r: 6 }}
            />
            <Scatter
              data={currentPoint}
              dataKey="kpd"
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