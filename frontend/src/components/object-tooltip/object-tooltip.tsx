// @ts-nocheck
// components/object-tooltip/object-tooltip.tsx

import React from 'react';
import {
  Paper,
  Typography,
  Box,
  Chip,
  Stack,
  Divider
} from '@mui/material';
import {
  Home,
  Plumbing,
  ElectricBolt,
  Close
} from '@mui/icons-material';

interface ObjectTooltipProps {
  open: boolean;
  onClose: () => void;
  feature: any;
  type: 'house' | 'ctp' | 'pipe';
  position: { x: number; y: number };
}

export const ObjectTooltip: React.FC<ObjectTooltipProps> = ({
  open,
  onClose,
  feature,
  type,
  position
}) => {
  if (!open || !feature) return null;

    // Добавляем небольшую задержку перед закрытием для лучшего UX
  const handleMouseLeave = (e: React.MouseEvent) => {
    e.stopPropagation();
    setTimeout(() => {
      onClose();
    }, 100);
  };

  const properties = feature.properties || {};

  const renderHouseInfo = () => (
    <Stack spacing={1}>
      <Box display="flex" alignItems="center" gap={1}>
        <Home color="primary" sx={{ fontSize: 18 }} />
        <Typography variant="subtitle2" fontWeight="bold">
          Жилой дом
        </Typography>
      </Box>
      
      <Typography variant="body2" fontWeight="medium">
        {properties.address || 'Адрес не указан'}
      </Typography>
      
      <Box display="flex" gap={1} flexWrap="wrap">
        <Chip label={`UNOM: ${properties.UNOM || '?'}`} size="small" variant="outlined" />
        <Chip label={`Этажи: ${properties.floors || '?'}`} size="small" />
      </Box>
    </Stack>
  );

  const renderCTPInfo = () => (
    <Stack spacing={1}>
      <Box display="flex" alignItems="center" gap={1}>
        <ElectricBolt color="secondary" sx={{ fontSize: 18 }} />
        <Typography variant="subtitle2" fontWeight="bold">
          ЦТП
        </Typography>
      </Box>
      
      <Chip 
        label={properties.ctp || 'ID не указан'} 
        color="secondary" 
        size="small" 
      />
      
      <Typography variant="body2">
        Насосы: {properties.pump_count || '?'}
      </Typography>
    </Stack>
  );

  const renderPipeInfo = () => (
    <Stack spacing={1}>
      <Box display="flex" alignItems="center" gap={1}>
        <Plumbing color="info" sx={{ fontSize: 18 }} />
        <Typography variant="subtitle2" fontWeight="bold">
          Труба
        </Typography>
      </Box>
      
      <Chip 
        label={`#${properties.pipe_id || '?'}`} 
        color="info" 
        size="small" 
      />
      
      <Box display="flex" gap={1} flexWrap="wrap">
        <Chip label={`${properties.length || '?'}м`} size="small" variant="outlined" />
        <Chip label={`Ø${properties.diameter || '?'}мм`} size="small" variant="outlined" />
      </Box>
    </Stack>
  );

  return (
    <Paper
      sx={{
        position: 'fixed',
        left: Math.min(position.x + 10, window.innerWidth - 300), // Не выходит за правый край
        top: Math.min(position.y + 10, window.innerHeight - 200), // Не выходит за нижний край
        zIndex: 9999,
        p: 1.5,
        maxWidth: 280,
        minWidth: 200,
        boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        backgroundColor: 'background.paper',
        pointerEvents: 'auto' // Разрешаем взаимодействие с тултипом
      }}
      onMouseLeave={handleMouseLeave}
      onClick={(e) => e.stopPropagation()} // Предотвращаем клики на карту через тултип
    >
      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={0.5}>
        <Chip 
          label={
            type === 'house' ? 'Дом' : 
            type === 'ctp' ? 'ЦТП' : 'Труба'
          } 
          color={
            type === 'house' ? 'primary' : 
            type === 'ctp' ? 'secondary' : 'info'
          }
          size="small"
        />
        <Close 
          sx={{ 
            fontSize: 16, 
            cursor: 'pointer',
            color: 'text.secondary',
            '&:hover': { color: 'text.primary' }
          }}
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
        />
      </Box>

      <Divider sx={{ my: 1 }} />
      
      {type === 'house' && renderHouseInfo()}
      {type === 'ctp' && renderCTPInfo()}
      {type === 'pipe' && renderPipeInfo()}
    </Paper>
  );
};