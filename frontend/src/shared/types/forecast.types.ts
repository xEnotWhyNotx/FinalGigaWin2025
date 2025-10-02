// types/forecast.types.ts
export interface ForecastData {
  timestamp: string;
  predicted: number[];
  real: number[];
  period: ForecastPeriod;
  objectId: string;
  objectType: 'ctp' | 'unom';
  lastUpdated: string;
}

export type ForecastPeriod = '2h' | '4h' | '6h' | '8h' | '12h' | '24h';

export interface ForecastState {
  forecasts: Record<string, ForecastData>; // key: `${objectType}-${objectId}-${period}`
  loading: boolean;
  error: string | null;
  lastFetch: Record<string, string>; // timestamp последнего успешного fetch по ключу
}

export interface FetchForecastParams {
  objectId: string;
  objectType: 'ctp' | 'unom';
  period: ForecastPeriod;
  timestamp: string;
}