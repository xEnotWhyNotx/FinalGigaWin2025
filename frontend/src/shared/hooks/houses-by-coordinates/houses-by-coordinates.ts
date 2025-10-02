// hooks/useHouseByCoordinates.ts
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../lib/api-client';

export interface HouseByCoordinatesData {
  house_info: {
    unom: number;
    ctp: string;
    address: string | null;
    coordinates: {
      lat: number;
      lon: number;
    } | null;
  };
  consumption_data: {
    predicted: number[];
    real: number[];
    timestamp: string[];
  };
  statistics: {
    total_real_consumption: number;
    total_predicted_consumption: number;
    average_real_consumption: number;
    average_predicted_consumption: number;
    max_real_consumption: number;
    min_real_consumption: number;
    max_predicted_consumption: number;
    min_predicted_consumption: number;
    average_deviation?: number;
    max_deviation?: number;
    min_deviation?: number;
    deviation_percentage?: number;
    current_real_consumption?: number;
    current_predicted_consumption?: number;
  };
  search_info: {
    search_coordinates: { lat: number; lon: number };
    search_radius_meters: number;
    found_house_unom: number;
  };
}

export interface HouseByCoordinatesParams {
  lat: number;
  lon: number;
  timestamp: string; // ISO format
  radius?: number; // optional, defaults to 100m
}

const fetchHouseByCoordinates = async (params: HouseByCoordinatesParams): Promise<HouseByCoordinatesData> => {
  const { data } = await apiClient.get<HouseByCoordinatesData>('/house_by_coordinates', { 
    params: {
      radius: 100,
      ...params
    }
  });
  return data;
};

export const useHouseByCoordinates = (params: HouseByCoordinatesParams) => {
  return useQuery({
    queryKey: ['house-by-coordinates', params],
    queryFn: () => fetchHouseByCoordinates(params),
    enabled: !!params.lat && !!params.lon && !!params.timestamp,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};