// types/ctp.types.ts
export interface CTPPressureFilters {
  ctp_id: string;        // ID центра трансформации (пример: '04-07-0222/057')
  timestamp: string;     // Временная метка в ISO формате (пример: '2025-09-28T20:00:00')
}

export interface CTPPressureResponse {
  // Структура будет зависеть от ответа build_ctp_pressure_payload
  // Пример ожидаемых полей на основе кода:
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
  // Добавьте другие поля на основе реального ответа
}