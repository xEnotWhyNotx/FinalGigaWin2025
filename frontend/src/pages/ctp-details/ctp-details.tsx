// pages/ctp-details/ctp-details.tsx
// @ts-nocheck
import React, { useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  Button,
  Stack,
  Grid,
  Alert,
  Card,
  CardContent,
  Chip,
} from '@mui/material';
import { 
  ArrowBack, 
  LocalFireDepartment, 
  WaterDrop, 
  ElectricBolt, 
  Speed, 
  Analytics,
  LocationOn,
  Settings,
  Apartment,
  Home,
  SquareFoot,
  People
} from '@mui/icons-material';
import { useCTPPressure } from '../../shared/hooks/use-ctp-pressure/use-ctp-pressure';

import { EfficiencyChart } from '../../components/charts/efficiency-chart/efficiency-chart';
import { PowerChart } from '../../components/charts/power-chart/power-chart';
import { PressureChart } from '../../components/charts/pressure-chart/pressure-chart';
import { WaterConsumptionChart } from '../../components/charts/water-consumption-chart/water-consumption-chart';
import { createCTPBalloonContent } from '../../components/map/map.utils';
import { useSelector } from 'react-redux';

import image from '../../../public/tech.png'

interface Properties {
  address?: string;
  name?: string;
  floors?: number;
  appartments?: number;
  live_area?: number;
  ctp?: string;
  UNOM?: string;
  osm_id?: string;
  capacity?: string;
  status?: string;
  id?: string;
}

interface CTPDetailsPageProps {}

export const CTPDetailsPage: React.FC<CTPDetailsPageProps> = () => {
  const { ctpId } = useParams<{ ctpId: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  // Получаем properties из state навигации
  const properties: Properties = location.state?.properties || {};
  
  // Берем timestamp из Redux store
  const timestampFromStore = useSelector((state: any) => state.alerts.currentTimestamp);

  // Если в store нет timestamp, используем текущее время как fallback
  const getFormattedTimestamp = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
  };

  const [fallbackTimestamp] = useState(getFormattedTimestamp());

  // Используем timestamp из store или fallback
  const timestamp = timestampFromStore || fallbackTimestamp;

  const { data: ctpData, isLoading, error } = useCTPPressure({
    ctp_id: ctpId!,
    timestamp: timestamp,
  });

  // Для отладки
  console.log('📅 Using timestamp:', timestamp);
  console.log('📅 From store:', timestampFromStore);
  console.log('📅 Fallback:', fallbackTimestamp);


  const handleBack = () => {
    navigate(-1);
  };

  console.log('🔍 CTP Details Debug:', {
    ctpId,
    timestamp,
    hasData: !!ctpData,
    isLoading,
    error,
    ctpData,
    properties // Добавляем properties в лог
  });

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Stack spacing={2} alignItems="center">
          <CircularProgress size={60} />
          <Typography variant="h6" color="text.secondary">
            Загрузка данных ЦТП...
          </Typography>
        </Stack>
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error" sx={{ mb: 2 }}>
          Ошибка загрузки данных для ЦТП {ctpId}
        </Alert>
        <Button 
          onClick={handleBack} 
          startIcon={<ArrowBack />} 
          variant="contained"
        >
          Назад к карте
        </Button>
      </Box>
    );
  }

  if (!ctpData) {
    return (
      <Box p={3}>
        <Alert severity="warning" sx={{ mb: 2 }}>
          Данные не найдены для ЦТП {ctpId}
        </Alert>
        <Button 
          onClick={handleBack} 
          startIcon={<ArrowBack />} 
          variant="outlined"
        >
          Назад к карте
        </Button>
      </Box>
    );
  }

  // Исправляем опечатку в ключе данных
  const consumptionData = ctpData.cunsumption_data || ctpData.consumption_data;
  const systemState = ctpData.system_state || {};
  const systemChar = ctpData.system_characteristic || {};

  // Статистические карточки системы
  const systemStatsCards = [
    {
      icon: <WaterDrop sx={{ fontSize: 24 }} />,
      title: 'Текущий расход',
      value: `${systemState.current_consumtion?.toFixed(1) || '0'} м³/ч`,
      color: 'primary'
    },
    {
      icon: <Speed sx={{ fontSize: 24 }} />,
      title: 'Напор',
      value: `${systemState.measured_pressure?.toFixed(1) || '0'} м вод. ст.`,
      color: 'secondary'
    },
    {
      icon: <ElectricBolt sx={{ fontSize: 24 }} />,
      title: 'Мощность',
      value: `${systemState.current_power?.toFixed(1) || '0'} кВт`,
      color: 'warning'
    },
    {
      icon: <Analytics sx={{ fontSize: 24 }} />,
      title: 'КПД системы',
      value: `${systemState.current_kpd?.toFixed(1) || '0'} %`,
      color: 'success'
    }
  ];

  const {
    ctp,
    source_pressure,
    static_pressure,
    max_flow,
    max_pressure,
    pump_count,
    pump_name,
    pump_max_flow,
    pipe_length,
    pipe_diameter
  } = properties;


  return (
    <Box sx={{ p: 3, backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      {/* Хедер */}
      <Paper 
        sx={{ 
          p: 3, 
          mb: 3, 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          borderRadius: 2
        }}
      >
        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
          <Button 
            onClick={handleBack} 
            startIcon={<ArrowBack />}
            sx={{ 
              color: 'white', 
              borderColor: 'white',
              '&:hover': {
                backgroundColor: 'rgba(255,255,255,0.1)'
              }
            }}
            variant="outlined"
          >
            Назад к карте
          </Button>
          <LocalFireDepartment sx={{ fontSize: 40 }} />
          <Box flex={1}>
            <Typography variant="h4" fontWeight="bold">
              ЦТП {ctpId}
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.9 }}>
              {properties.name || properties.address || 'Тепловой пункт'}
            </Typography>
          </Box>
          <Chip 
            icon={<LocationOn />}
            label={properties.status || "Активен"}
            color={properties.status === 'Не активен' ? 'error' : 'success'}
            variant="filled"
            sx={{ backgroundColor: 'rgba(255,255,255,0.2)', color: 'white' }}
          />
        </Stack>

        {/* Информация об объекте и системе */}
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Stack spacing={1}>
              <Typography variant="subtitle1" fontWeight="bold">
                🏢 Информация об объекте
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {properties.address && (
                  <Chip 
                    label={`Адрес: ${properties.address}`}
                    size="small"
                    variant="outlined"
                    sx={{ backgroundColor: 'rgba(255,255,255,0.1)', color: 'white' }}
                  />
                )}
                {properties.UNOM && (
                  <Chip 
                    label={`УНОМ: ${properties.UNOM}`}
                    size="small"
                    variant="outlined"
                    sx={{ backgroundColor: 'rgba(255,255,255,0.1)', color: 'white' }}
                  />
                )}
                {properties.capacity && (
                  <Chip 
                    label={`Мощность: ${properties.capacity}`}
                    size="small"
                    variant="outlined"
                    sx={{ backgroundColor: 'rgba(255,255,255,0.1)', color: 'white' }}
                  />
                )}
              </Box>
            </Stack>
          </Grid>
<Grid item xs={12} md={6}>
  <Stack spacing={1}>
    <Typography variant="subtitle1" fontWeight="bold" sx={{ color: 'white' }}>
      📈 Текущее состояние системы
    </Typography>
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
      <Chip 
        label={`В работе: ${systemState.pumps_working || 0} насосов`}
        size="small"
        variant="filled"
        sx={{ 
          backgroundColor: 'rgba(76, 175, 80, 0.9)',
          color: 'white',
          fontSize: '0.8rem',
          fontWeight: 'bold',
          padding: '6px 8px',
          height: 'auto',
          minWidth: '120px',
          '& .MuiChip-label': {
            padding: '4px 6px'
          }
        }}
      />
      <Chip 
        label={`Уд. мощность: ${systemState.unit_power?.toFixed(2) || '0'} кВт`}
        size="small"
        variant="filled"
        sx={{ 
          backgroundColor: 'rgba(33, 150, 243, 0.9)',
          color: 'white',
          fontSize: '0.8rem',
          fontWeight: 'bold',
          padding: '6px 8px',
          height: 'auto',
          minWidth: '120px',
          '& .MuiChip-label': {
            padding: '4px 6px'
          }
        }}
      />
    </Box>
  </Stack>
</Grid>
        </Grid>
      </Paper>


                

      {/* Основные графики */}
      <Grid container spacing={3}>
        {/* График 1: Расход воды */}
        <Grid item xs={12} lg={6}>
          <Paper 
            sx={{ 
              p: 3, 
              height: 400,
              borderRadius: 2,
              boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
            }}
          >
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
              <WaterDrop color="primary" />
              <Typography variant="h6" fontWeight="bold">
                Расход воды
              </Typography>
            </Stack>
            {consumptionData ? (
              <WaterConsumptionChart data={consumptionData} />
            ) : (
              <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                <Typography variant="body2" color="text.secondary">
                  Нет данных о расходе воды
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* График 2: Характеристика системы (напор) */}
        <Grid item xs={12} lg={6}>
          <Paper 
            sx={{ 
              p: 3, 
              height: 400,
              borderRadius: 2,
              boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
            }}
          >
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
              <Speed color="secondary" />
              <Typography variant="h6" fontWeight="bold">
                QH-характеристика
              </Typography>
            </Stack>
            <PressureChart data={ctpData.pressure_data} />
          </Paper>
        </Grid>

        {/* График 3: Потребляемая мощность */}
        <Grid item xs={12} lg={6}>
          <Paper 
            sx={{ 
              p: 3, 
              height: 400,
              borderRadius: 2,
              boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
            }}
          >
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
              <ElectricBolt color="warning" />
              <Typography variant="h6" fontWeight="bold">
                Потребляемая мощность 1 насоса
              </Typography>
            </Stack>
            <PowerChart data={ctpData.power_data} />
          </Paper>
        </Grid>

        {/* График 4: КПД насоса */}
        <Grid item xs={12} lg={6}>
          <Paper 
            sx={{ 
              p: 3, 
              height: 400,
              borderRadius: 2,
              boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
            }}
          >
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
              <Analytics color="success" />
              <Typography variant="h6" fontWeight="bold">
                КПД насоса
              </Typography>
            </Stack>
            <EfficiencyChart data={ctpData.kpd_data} />
          </Paper>
        </Grid>
      </Grid>

      {/* Дополнительная информация */}
      <Paper 
        sx={{ 
          p: 3, 
          mt: 3,
          borderRadius: 2,
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
          <Settings color="action" />
          <Typography variant="h6" fontWeight="bold">
            Техническая информация
          </Typography>
        </Stack>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Параметры насосной станции
            </Typography>
            <Stack spacing={1}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2">Модель насоса:</Typography>
                <Typography variant="body2" fontWeight="bold">
                  {systemChar.pump_name || 'Не указано'}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2">Количество насосов:</Typography>
                <Typography variant="body2" fontWeight="bold">
                  {systemChar.pump_count || 0} шт
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2">Макс. производительность:</Typography>
                <Typography variant="body2" fontWeight="bold">
                  {systemChar.pump_max_flow || 0} м³/ч
                </Typography>
              </Box>
            </Stack>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Параметры трубопровода
            </Typography>
            <Stack spacing={1}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2">Диаметр трубы:</Typography>
                <Typography variant="body2" fontWeight="bold">
                  {systemChar.pipe_diameter || 0} мм
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2">Длина трубопровода:</Typography>
                <Typography variant="body2" fontWeight="bold">
                  {systemChar.pipe_length || 0} м
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2">Обновлено:</Typography>
                <Typography variant="body2" fontWeight="bold">
                  {new Date().toLocaleString('ru-RU')}
                </Typography>
              </Box>
            </Stack>
          </Grid>
          {/* <Grid>
            <img src={image}/>
          </Grid> */}
        </Grid>
      </Paper>
    </Box>
  );
};