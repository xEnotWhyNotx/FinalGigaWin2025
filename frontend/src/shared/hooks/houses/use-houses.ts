// hooks/useHouses.ts
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../lib/api-client';

export interface House {
  unom: number;
  ctp: string;
  address: string | null;
  coordinates: {
    lat: number;
    lon: number;
  };
  properties: Record<string, any>;
}

export interface HousesResponse {
  houses: House[];
  total_count: number;
}

const fetchHouses = async (): Promise<HousesResponse> => {
  const { data } = await apiClient.get<HousesResponse>('/houses');
  return data;
};

export const useHouses = () => {
  return useQuery({
    queryKey: ['houses'],
    queryFn: fetchHouses,
    staleTime: 30 * 60 * 1000,
  });
};