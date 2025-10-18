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
  console.log('PowerChart data:', data);

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

  // Кастомный тултип для PowerChart
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      // Фильтруем payload, оставляя только нужные данные
      const filteredPayload = payload.filter((entry: any) => 
        entry.dataKey === 'power' && (entry.name === 'Мощность насоса' || entry.name === 'Текущее состояние')
      );

      return (
        <Paper sx={{ p: 2, bgcolor: 'background.paper', border: 1, borderColor: 'divider' }}>
          <Typography variant="subtitle2" gutterBottom>
            📊 Расход: <strong>{label.toFixed(1)} м³/ч</strong>
          </Typography>
          {filteredPayload.map((entry: any, index: number) => (
            <Typography 
              key={index} 
              variant="body2" 
              sx={{ color: entry.color }}
            >
              {entry.name === 'Мощность насоса' && '⚡ '}
              {entry.name === 'Текущее состояние' && '🔴 '}
              <strong>{entry.name}:</strong> {entry.value.toFixed(1)} кВт
            </Typography>
          ))}
        </Paper>
      );
    }
    return null;
  };

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
          <ComposedChart margin={{ top: 20, right: 20, left: 20, bottom: 40 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
            <XAxis 
              dataKey="consumption"
              label={{ 
                value: 'Расход, м³/ч', 
                position: 'insideBottom',
                offset: 0,
                style: { transform: 'translateY(10px)' } 
              }}
              type="number"
            />
            <YAxis 
              label={{ 
                value: 'Мощность, кВт', 
                angle: -90, 
                position: 'insideLeft',
              }}
              type="number"
            />
            <Tooltip content={<CustomTooltip />} />
            {/* Убрал Legend */}
            <Line
              data={pumpData}
              dataKey="power"
              stroke="#ff7300"
              strokeWidth={3}
              name="Мощность насоса"
              dot={false}
              activeDot={{ r: 6 }}
            />
            <Scatter
              data={[{ consumption: current_state.consumption, power: current_state.power }]}
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