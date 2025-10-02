// @ts-nocheck
// hooks/useAlerts.ts
import { useQuery } from '@tanstack/react-query';
import { useDispatch } from 'react-redux';
import type { Alert, AlertFilters } from '../../types/alert.types';
import { apiClient } from '../../lib/api-client';
import { fetchAlertsStart, fetchAlertsSuccess, fetchAlertsError } from '../../slices/alertsSlice';

// Функция для преобразования уровня серьезности с сервера
const mapServerLevelToSeverity = (level: string): 'high' | 'medium' | 'low' => {
  if (!level) return 'medium';
  
  switch (level.toLowerCase()) {
    case 'высокий':
    case 'high':
      return 'high';
    case 'средний':
    case 'medium':
      return 'medium';
    case 'низкий':
    case 'low':
      return 'low';
    default:
      return 'medium';
  }
};

// Функция для нормализации данных с сервера
const normalizeAlert = (serverAlert: any, index: number): Alert => {
  return {
    id: serverAlert.object_id || `alert-${index}`,
    alert_message: serverAlert.alert_message || 'Нет описания',
    comment: serverAlert.comment || '',
    level: serverAlert.level || 'Не указан',
    object_id: serverAlert.object_id || '',
    type: serverAlert.type || 'unknown',
    severity: mapServerLevelToSeverity(serverAlert.level),
    timestamp: serverAlert.timestamp || new Date().toISOString(),
    duration: serverAlert.duration || 4,
  };
};

const fetchAlerts = async (filters: any = {}): Promise<Alert[]> => {
  const params: Record<any, any> = {};

  params.timestamp = filters.timestamp;

  console.log('📤 Sending request to /alerts with params:', params);

  try {
    const { data } = await apiClient.get<any[]>('/alerts', { params });
    
    if (!data || !Array.isArray(data)) {
      console.warn('⚠️ No data or invalid format received from server');
      return [];
    }

    console.log(data, 'full date from api')
    
    return data.map((alert, index) => normalizeAlert(alert, index));
  } catch (error: any) {
    console.error('❌ Error fetching alerts:', error);
    throw error;
  }
};

export const useAlerts = (filters: Partial<AlertFilters> = {}) => {
  const dispatch = useDispatch();

  return useQuery({
    queryKey: ['alerts', filters],
    queryFn: async () => {
      // Диспатчим начало загрузки с timestamp из фильтров
      dispatch(fetchAlertsStart(filters.timestamp));
      
      try {
        const alerts = await fetchAlerts(filters);
        console.log(alerts, 'useQuery')
        // Диспатчим успешную загрузку с timestamp из фильтров
        dispatch(fetchAlertsSuccess({ alerts, timestamp: filters.timestamp }));
        return alerts;
      } catch (error: any) {
        // Диспатчим ошибку с timestamp из фильтров
        const errorMessage = error.response?.data?.error || error.message || 'Unknown error';
        dispatch(fetchAlertsError({ error: errorMessage, timestamp: filters.timestamp }));
        throw error;
      }
    },
    staleTime: 2 * 60 * 1000,
    retry: 2,
  });
};