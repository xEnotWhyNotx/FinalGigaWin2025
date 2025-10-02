// hooks/use-ctp-pressure/use-ctp-pressure-mutation.ts
import { useMutation } from '@tanstack/react-query';
import { apiClient } from '../../lib/api-client';

export const useCTPPressureMutation = () => {
  return useMutation({
    mutationFn: async ({ 
      ctp_id, 
      timestamp,
      feature 
    }: { 
      ctp_id: string; 
      timestamp: string;
      feature?: any;
    }) => {
      const params: Record<string, string> = {
        ctp_id,
        timestamp
      };

      console.log('📤 Requesting CTP pressure data for:', ctp_id);

      const { data } = await apiClient.get<any>('/ctp_data_pressure', { params });

      // Обогащаем ответ метаданными из GeoJSON
      if (feature) {
        return {
          ...data,
          ctp_metadata: feature.properties
        };
      }

      return data;
    },
  });
};