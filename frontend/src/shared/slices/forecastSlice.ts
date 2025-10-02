// store/slices/forecastSlice.ts
import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import { apiClient } from '../lib/api-client';
import type { FetchForecastParams, ForecastData, ForecastState } from '../types/forecast.types';


// Генерация ключа для хранения в store
const generateForecastKey = (params: FetchForecastParams): string => {
  return `${params.objectType}-${params.objectId}-${params.period}`;
};

// Async thunk для загрузки прогноза
export const fetchForecast = createAsyncThunk(
  'forecast/fetchForecast',
  async (params: FetchForecastParams, { rejectWithValue }) => {
    try {
      const { objectId, objectType, period, timestamp } = params;
      
      // Определяем endpoint в зависимости от типа объекта
      const endpoint = objectType === 'ctp' ? '/ctp_data' : '/mcd_data';
      
      const { data } = await apiClient.get(endpoint, {
        params: {
          [objectType === 'ctp' ? 'ctp_id' : 'unom']: objectId,
          timestamp: timestamp
        }
      });

      // Преобразуем данные в наш формат
      const forecastData: ForecastData = {
        timestamp,
        predicted: data.predicted || [],
        real: data.real || [],
        period,
        objectId,
        objectType,
        lastUpdated: new Date().toISOString()
      };

      return forecastData;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch forecast');
    }
  }
);

const initialState: ForecastState = {
  forecasts: {},
  loading: false,
  error: null,
  lastFetch: {}
};

const forecastSlice = createSlice({
  name: 'forecast',
  initialState,
  reducers: {
    // Очистка ошибки
    clearError: (state) => {
      state.error = null;
    },
    
    // Инвалидация кэша для конкретного прогноза
    invalidateForecast: (state, action: PayloadAction<FetchForecastParams>) => {
      const key = generateForecastKey(action.payload);
      delete state.forecasts[key];
      delete state.lastFetch[key];
    },
    
    // Инвалидация всех прогнозов
    invalidateAllForecasts: (state) => {
      state.forecasts = {};
      state.lastFetch = {};
    },
    
    // Принудительное обновление конкретного прогноза
    forceRefreshForecast: (state, action: PayloadAction<FetchForecastParams>) => {
      const key = generateForecastKey(action.payload);
      delete state.forecasts[key];
      delete state.lastFetch[key];
    }
  },
  extraReducers: (builder) => {
    builder
      // Pending
      .addCase(fetchForecast.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      // Fulfilled
      .addCase(fetchForecast.fulfilled, (state, action) => {
        state.loading = false;
        const forecast = action.payload;
        const key = generateForecastKey({
            objectId: forecast.objectId,
            objectType: forecast.objectType,
            period: forecast.period,
            timestamp: ''
        });
        
        state.forecasts[key] = forecast;
        state.lastFetch[key] = new Date().toISOString();
      })
      // Rejected
      .addCase(fetchForecast.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  }
});

export const { 
  clearError, 
  invalidateForecast, 
  invalidateAllForecasts, 
  forceRefreshForecast 
} = forecastSlice.actions;

export default forecastSlice.reducer;