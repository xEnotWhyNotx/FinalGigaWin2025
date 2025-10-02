// hooks/useCtpData.ts
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../lib/api-client';

export interface CtpData {
  predicted: number[];
  real: number[];
  timestamp: string[];
}

export interface CtpDataParams {
  ctp_id: string;
  timestamp: string; // ISO format
}

const fetchCtpData = async (params: CtpDataParams): Promise<CtpData> => {
  const { data } = await apiClient.get<CtpData>('/ctp_data', { params });
  return data;
};

export const useCtpData = (params: CtpDataParams) => {
  return useQuery({
    queryKey: ['ctp-data', params],
    queryFn: () => fetchCtpData(params),
    enabled: !!params.ctp_id && !!params.timestamp,
    staleTime: 5 * 60 * 1000,
  });
};