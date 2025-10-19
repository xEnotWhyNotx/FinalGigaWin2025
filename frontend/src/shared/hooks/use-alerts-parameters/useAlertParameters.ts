// hooks/useAlertParameters.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/api-client';

export interface AlertParameters {
  pump_cavitation_multiplier: {
    value: number;
    range: { min: number; max: number };
    description: string;
  };
  small_leakage_excedents_threshold: {
    value: number;
    range: { min: number; max: number };
    description: string;
  };
}

export interface UpdateAlertParameters {
  pump_cavitation_multiplier?: number;
  small_leakage_excedents_threshold?: number;
}

// Получение параметров
const fetchAlertParameters = async (): Promise<AlertParameters> => {
  const { data } = await apiClient.get<AlertParameters>('/config/alert_parameters');
  return data;
};

// Обновление параметров
const updateAlertParameters = async (params: UpdateAlertParameters): Promise<AlertParameters> => {
  const { data } = await apiClient.put<AlertParameters>('/config/alert_parameters', params);
  return data;
};

export const useAlertParameters = () => {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['alert-parameters'],
    queryFn: fetchAlertParameters,
    staleTime: 5 * 60 * 1000,
  });

  const mutation = useMutation({
    mutationFn: updateAlertParameters,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alert-parameters'] });
    },
  });

  return {
    parameters: data,
    isLoading,
    error,
    updateParameters: mutation.mutate,
    isUpdating: mutation.isPending,
  };
};