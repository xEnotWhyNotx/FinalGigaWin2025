// hooks/useMCDData.ts

import { apiClient } from '../../lib/api-client';
import { useQuery } from '@tanstack/react-query';

export interface MCDFilters {
  unom: string;
  timestamp: string;
}

export interface MCDResponse {
  predicted: number[];
  real: number[];
  timestamp: string[];
  statistics?: {
    max_consumption: number;
    avg_consumption: number;
    min_consumption: number;
    total_consumption: number;
  };
  // Метаданные из GeoJSON
  mcd_metadata?: {
    address?: string;
    UNOM?: string;
    osm_id?: string;
    floors?: number;
    appartments?: number;
    live_area?: number;
    capacity?: string;
    status?: string;
  };
}

// Функция для получения метаданных дома из GeoJSON
const getMCDMetadata = (unom: string, housesGeoJSON: any) => {
  const feature = housesGeoJSON.features.find(
    (f: any) => f.properties.UNOM === unom
  );
  return feature ? feature.properties : null;
};

const fetchMCDData = async (
  filters: MCDFilters, 
  housesGeoJSON?: any
): Promise<MCDResponse> => {
  const params: Record<string, string> = {
    unom: filters.unom,
    timestamp: filters.timestamp
  };

  console.log('📤 Requesting MCD data for UNOM:', filters.unom);

  const { data } = await apiClient.get<MCDResponse>('/mcd_data', { params });

  // Обогащаем ответ метаданными из GeoJSON
  if (housesGeoJSON) {
    const metadata = getMCDMetadata(filters.unom, housesGeoJSON);
    return {
      ...data,
      mcd_metadata: metadata
    };
  }

  return data;
};

export const useMCDData = (
  filters: MCDFilters, 
  housesGeoJSON?: any,
  enabled: boolean = true
) => {
  return useQuery({
    queryKey: ['mcd-data', filters.unom, filters.timestamp],
    queryFn: () => fetchMCDData(filters, housesGeoJSON),
    staleTime: 5 * 60 * 1000,
    retry: 2,
    enabled: Boolean(filters.unom && filters.timestamp && enabled),
  });
};