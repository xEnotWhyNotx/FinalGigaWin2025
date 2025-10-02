// @ts-nocheck
// components/AlertsFilter.tsx
import React from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Slider,
  FormGroup,
  FormControlLabel,
  Switch,
  Divider,
  Chip,
  Stack,
} from '@mui/material';
import { Refresh, FilterList, Clear } from '@mui/icons-material';
import type { AlertFilters } from '../../shared/types/alert.types';

interface AlertsFilterProps {
  filters: AlertFilters;
  onFiltersChange: (filters: AlertFilters) => void;
  onRefresh: () => void;
  onClear: () => void;
  loading: boolean;
}

export const AlertsFilter: React.FC<AlertsFilterProps> = ({
  filters,
  onFiltersChange,
  onRefresh,
  onClear,
  loading,
}) => {
  const handleDurationChange = (_: Event, value: number | number[]) => {
    onFiltersChange({
      ...filters,
      duration_threshold: value as number,
    });
  };

  const handleTimestampChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onFiltersChange({
      ...filters,
      timestamp: event.target.value,
    });
  };

  const handleUseCurrentTime = () => {
    onFiltersChange({
      ...filters,
      timestamp: 'NOW',
    });
  };

  const handleCustomTimeToggle = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.checked) {
      onFiltersChange({
        ...filters,
        timestamp: 'NOW',
      });
    } else {
      onFiltersChange({
        ...filters,
        timestamp: new Date().toISOString().slice(0, 16),
      });
    }
  };

  const isCustomTime = filters.timestamp !== 'NOW';

  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <FilterList sx={{ mr: 1 }} />
        <Typography variant="h6">Фильтры алертов</Typography>
      </Box>

      <Divider sx={{ mb: 2 }} />

      <Stack spacing={3}>
        {/* Порог длительности события */}
        <Box>
          <Typography variant="body2" gutterBottom>
            Порог длительности события: {filters.duration_threshold} часов
          </Typography>
          <Slider
            value={filters.duration_threshold}
            onChange={handleDurationChange}
            min={1}
            max={24}
            step={1}
            valueLabelDisplay="auto"
            disabled={loading}
          />
        </Box>

        {/* Временная метка */}
        <Box>
          <FormGroup>
            <FormControlLabel
              control={
                <Switch
                  checked={isCustomTime}
                  onChange={handleCustomTimeToggle}
                  disabled={loading}
                />
              }
              label="Указать конкретное время"
            />
          </FormGroup>

          {isCustomTime ? (
            <TextField
              fullWidth
              type="datetime-local"
              value={filters.timestamp}
              onChange={handleTimestampChange}
              disabled={loading}
              size="small"
              sx={{ mt: 1 }}
            />
          ) : (
            <Chip
              label="Текущее время"
              variant="outlined"
              sx={{ mt: 1 }}
            />
          )}
        </Box>

        {/* Кнопки действий */}
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="contained"
            startIcon={<Refresh />}
            onClick={onRefresh}
            disabled={loading}
            sx={{ flex: 1 }}
          >
            {loading ? 'Загрузка...' : 'Обновить'}
          </Button>
          
          <Button
            variant="outlined"
            startIcon={<Clear />}
            onClick={onClear}
            disabled={loading}
          >
            Очистить
          </Button>
        </Box>
      </Stack>
    </Paper>
  );
};