// hooks/useHouseData.ts
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../lib/api-client';

export interface HouseData {
  predicted: number[];
  real: number[];
  timestamp: string[];
}

export interface HouseDataParams {
  unom: number;
  timestamp: string; // ISO format
}

const fetchHouseData = async (params: HouseDataParams): Promise<HouseData> => {
  const { data } = await apiClient.get<HouseData>('/mcd_data', { params });
  return data;
};

export const useHouseData = (params: HouseDataParams) => {
  return useQuery({
    queryKey: ['house-data', params],
    queryFn: () => fetchHouseData(params),
    enabled: !!params.unom && !!params.timestamp,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};