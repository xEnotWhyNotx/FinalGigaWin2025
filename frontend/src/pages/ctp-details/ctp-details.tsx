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
  Home,
} from '@mui/icons-material';
import { useCTPPressure } from '../../shared/hooks/use-ctp-pressure/use-ctp-pressure';
import { EfficiencyChart } from '../../components/charts/efficiency-chart/efficiency-chart';
import { PowerChart } from '../../components/charts/power-chart/power-chart';
import { PressureChart } from '../../components/charts/pressure-chart/pressure-chart';
import { WaterConsumptionChart } from '../../components/charts/water-consumption-chart/water-consumption-chart';
import { useSelector } from 'react-redux';
import { useMCDData } from '../../shared/hooks/mcd-data/use-mcd-data';

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
  const objectType = location.state?.objectType || 'ctp';

  // Берем timestamp из Redux store
  const timestampFromStore = useSelector((state: any) => state.alerts.currentTimestamp);

  const showAllCharts = objectType === 'ctp';
  const showOnlyWaterConsumption = objectType === 'house';

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
  const timestamp = timestampFromStore || fallbackTimestamp;

  // Используем разные хуки в зависимости от типа объекта
  const { 
    data: ctpData, 
    isLoading: ctpLoading, 
    error: ctpError 
  } = useCTPPressure({
    ctp_id: ctpId!,
    timestamp: timestamp,
  }, undefined, objectType === 'ctp'); // Включаем только для ЦТП
  
  const { 
    data: mcdData, 
    isLoading: mcdLoading, 
    error: mcdError 
  } = useMCDData({
    unom: ctpId!,
    timestamp: timestamp,
  }, undefined, objectType === 'house'); // Включаем только для домов

  // Объединяем состояния загрузки и ошибок
  const isLoading = objectType === 'ctp' ? ctpLoading : mcdLoading;
  const error = objectType === 'ctp' ? ctpError : mcdError;
  const data = objectType === 'ctp' ? ctpData : mcdData;

  const handleBack = () => {
    navigate(-1);
  };

  console.log('🔍 Details Debug:', {
    ctpId,
    objectType,
    timestamp,
    hasData: !!data,
    isLoading,
    error,
    ctpData,
    mcdData,
    properties
  });

  // Преобразуем данные дома в формат для WaterConsumptionChart
  const getConsumptionDataForHouse = () => {
    if (!mcdData) return null;
    
    return mcdData.timestamp.map((timestamp, index) => ({
      timestamp,
      consumption: mcdData.real[index] || 0,
      predicted: mcdData.predicted[index] || 0
    }));
  };

  // Получаем данные для графика в зависимости от типа
  const consumptionData = objectType === 'ctp' 
    ? (ctpData?.cunsumption_data || ctpData?.consumption_data)
    : getConsumptionDataForHouse();

  const systemState = ctpData?.system_state || {};
  const systemChar = ctpData?.system_characteristic || {};

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Stack spacing={2} alignItems="center">
          <CircularProgress size={60} />
          <Typography variant="h6" color="text.secondary">
            Загрузка данных {objectType === 'house' ? 'дома' : 'ЦТП'}...
          </Typography>
        </Stack>
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error" sx={{ mb: 2 }}>
          Ошибка загрузки данных для {objectType === 'house' ? 'дома' : 'ЦТП'} {ctpId}
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

  if (!data) {
    return (
      <Box p={3}>
        <Alert severity="warning" sx={{ mb: 2 }}>
          Данные не найдены для {objectType === 'house' ? 'дома' : 'ЦТП'} {ctpId}
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

  return (
    <Box sx={{ p: 3, backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      {/* Хедер */}
      <Paper 
        sx={{ 
          p: 3, 
          mb: 3, 
          background: objectType === 'house' 
            ? 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' 
            : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
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
          {objectType === 'house' ? (
            <Home sx={{ fontSize: 40 }} />
          ) : (
            <LocalFireDepartment sx={{ fontSize: 40 }} />
          )}
          <Box flex={1}>
            <Typography variant="h4" fontWeight="bold">
              {objectType === 'house' ? `Дом ${ctpId}` : `ЦТП ${ctpId}`}
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.9 }}>
              {objectType === 'house' 
                ? (properties.address || 'Жилой дом')
                : (properties.name || properties.address || 'Тепловой пункт')
              }
            </Typography>
          </Box>
          <Chip 
            icon={objectType === 'house' ? <Home /> : <LocationOn />}
            label={objectType === 'house' ? "Жилой дом" : (properties.status || "Активен")}
            color={objectType === 'house' ? 'primary' : (properties.status === 'Не активен' ? 'error' : 'success')}
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
                {objectType === 'house' && mcdData?.statistics && (
                  <Chip 
                    label={`Ср. расход: ${mcdData.statistics.avg_consumption?.toFixed(1)} м³/ч`}
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
                {objectType === 'ctp' ? (
                  <>
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
                  </>
                ) : (
                  <Chip 
                    label={`Текущий расход: ${mcdData?.real?.[mcdData.real.length - 1]?.toFixed(1) || '0'} м³/ч`}
                    size="small"
                    variant="filled"
                    sx={{ 
                      backgroundColor: 'rgba(76, 175, 80, 0.9)',
                      color: 'white',
                      fontSize: '0.8rem',
                      fontWeight: 'bold',
                      padding: '6px 8px',
                      height: 'auto',
                      minWidth: '140px',
                      '& .MuiChip-label': {
                        padding: '4px 6px'
                      }
                    }}
                  />
                )}
              </Box>
            </Stack>
          </Grid>
        </Grid>
      </Paper>

      {/* Основные графики - условный рендеринг */}
      <Grid container spacing={3}>
        {/* График расхода воды - показываем всегда */}
        <Grid item xs={12} lg={showOnlyWaterConsumption ? 12 : 6}>
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
              <WaterConsumptionChart 
                data={consumptionData} 
                showPrediction={true}
              />
            ) : (
              <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                <Typography variant="body2" color="text.secondary">
                  Нет данных о расходе воды
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Остальные графики показываем только для ЦТП */}
        {showAllCharts && (
          <>
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
                <PressureChart data={ctpData?.pressure_data} />
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
                <PowerChart data={ctpData?.power_data} />
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
                <EfficiencyChart data={ctpData?.kpd_data} />
              </Paper>
            </Grid>
          </>
        )}
      </Grid>

      {/* Техническую информацию показываем только для ЦТП */}
      {showAllCharts && (
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
          </Grid>
        </Paper>
      )}
    </Box>
  );
};