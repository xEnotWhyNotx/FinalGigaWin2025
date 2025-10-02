// hooks/useGeocoding.ts
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../lib/api-client';

export interface GeocodingResult {
  address: string;
  coordinates: {
    lat: number;
    lon: number;
  };
}

export interface GeocodingParams {
  lat: number;
  lon: number;
}

const fetchGeocoding = async (params: GeocodingParams): Promise<GeocodingResult> => {
  const { data } = await apiClient.get<GeocodingResult>('/geocoding', { params });
  return data;
};

export const useGeocoding = (params: GeocodingParams) => {
  return useQuery({
    queryKey: ['geocoding', params],
    queryFn: () => fetchGeocoding(params),
    enabled: !!params.lat && !!params.lon,
    staleTime: 60 * 60 * 1000, // 1 hour - адреса редко меняются
  });
};