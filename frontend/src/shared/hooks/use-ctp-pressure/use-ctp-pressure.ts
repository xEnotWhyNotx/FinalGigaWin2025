// hooks/useCTPPressure.ts
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../lib/api-client';

export interface CTPPressureFilters {
  ctp_id: string;
  timestamp: string;
}

// Расширяем интерфейс с данными из GeoJSON
export interface CTPPressureResponse {
  pressure_data: {};
  power_data: {};
  kpd_data: {};
  ctp_id: string;
  period_start: string;
  period_end: string;
  consumption_data: Array<{
    timestamp: string;
    consumption: number;
    pressure?: number;
  }>;
  statistics?: {
    max_consumption: number;
    avg_consumption: number;
    pressure_level: string;
  };
  // Добавляем статические характеристики из GeoJSON
  ctp_metadata?: {
    latitude: number;
    longitude: number;
    source_pressure: number;
    static_pressure: number;
    max_flow: number;
    max_pressure: number;
    pump_count: number;
    pump_name: string;
    pump_max_flow: number;
    pipe_length: number;
    pipe_diameter: number;
  };
}

// Функция для получения метаданных ЦТП из GeoJSON
const getCTPMetadata = (ctpId: string, ctpGeoJSON: any) => {
  const feature = ctpGeoJSON.features.find(
    (f: any) => f.properties.ctp === ctpId
  );
  return feature ? feature.properties : null;
};

const fetchCTPPressure = async (
  filters: CTPPressureFilters, 
  ctpGeoJSON?: any // Передаем GeoJSON данные
): Promise<CTPPressureResponse> => {
  const params: Record<string, string> = {
    ctp_id: filters.ctp_id,
    timestamp: filters.timestamp
  };

  console.log('📤 Requesting CTP pressure data for:', filters.ctp_id);

  const { data } = await apiClient.get<CTPPressureResponse>('/ctp_data_pressure', { params });

  // Обогащаем ответ метаданными из GeoJSON
  if (ctpGeoJSON) {
    const metadata = getCTPMetadata(filters.ctp_id, ctpGeoJSON);
    return {
      ...data,
      ctp_metadata: metadata
    };
  }

  return data;
};

export const useCTPPressure = (
  filters: CTPPressureFilters, 
  ctpGeoJSON?: any,
  enabled: boolean = true // Добавляем параметр enabled
) => {
  return useQuery({
    queryKey: ['ctp-pressure', filters.ctp_id, filters.timestamp],
    queryFn: () => fetchCTPPressure(filters, ctpGeoJSON),
    staleTime: 5 * 60 * 1000,
    retry: 2,
    enabled: Boolean(filters.ctp_id && filters.timestamp && enabled), // Учитываем enabled
  });
};