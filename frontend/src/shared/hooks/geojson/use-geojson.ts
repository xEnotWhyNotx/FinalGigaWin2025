// hooks/useGeoJson.ts
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../lib/api-client';

export interface GeoJsonFeature {
  type: string;
  geometry: {
    type: string;
    coordinates: number[][];
  };
  properties: {
    Начало?: string;
    Конец?: number;
    [key: string]: any;
  };
}

export interface GeoJsonData {
  type: string;
  features: GeoJsonFeature[];
}

const fetchGeoJson = async (): Promise<GeoJsonData> => {
  const { data } = await apiClient.get<GeoJsonData>('/geojson');
  return data;
};

export const useGeoJson = () => {
  return useQuery({
    queryKey: ['geojson'],
    queryFn: fetchGeoJson,
    staleTime: 30 * 60 * 1000, // 30 minutes
  });
};