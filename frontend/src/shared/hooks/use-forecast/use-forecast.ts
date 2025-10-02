// hooks/useForecast.ts

import { useCallback } from "react";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import type { FetchForecastParams, ForecastPeriod } from "../../types/forecast.types";
import { fetchForecast, forceRefreshForecast, invalidateForecast } from "../../slices/forecastSlice";


// Время кэширования для разных периодов (в миллисекундах)
const CACHE_TIMES: Record<ForecastPeriod, number> = {
  '2h': 5 * 60 * 1000,  // 5 минут
  '4h': 10 * 60 * 1000, // 10 минут
  '6h': 15 * 60 * 1000, // 15 минут
  '8h': 20 * 60 * 1000, // 20 минут
  '12h': 30 * 60 * 1000, // 30 минут
  '24h': 60 * 60 * 1000, // 1 час
};

export const useForecast = () => {
  const dispatch = useAppDispatch();
  const { forecasts, loading, error, lastFetch } = useAppSelector(state => state.forecast);

  // Генерация ключа
  const generateKey = useCallback((params: FetchForecastParams): string => {
    return `${params.objectType}-${params.objectId}-${params.period}`;
  }, []);

  // Проверка нужно ли обновлять данные
  const shouldRefresh = useCallback((key: string, period: ForecastPeriod): boolean => {
    const lastFetchTime = lastFetch[key];
    if (!lastFetchTime) return true;

    const cacheTime = CACHE_TIMES[period];
    const timeSinceLastFetch = Date.now() - new Date(lastFetchTime).getTime();
    
    return timeSinceLastFetch > cacheTime;
  }, [lastFetch]);

  // Получение прогноза с кэшированием
  const getForecast = useCallback(async (params: FetchForecastParams) => {
    const key = generateKey(params);
    
    // Если данные есть в кэше и не устарели - возвращаем их
    const existingForecast = forecasts[key];
    if (existingForecast && !shouldRefresh(key, params.period)) {
      return existingForecast;
    }

    // Иначе загружаем новые данные
    const result = await dispatch(fetchForecast(params));
    
    if (fetchForecast.fulfilled.match(result)) {
      return result.payload;
    }
    
    throw new Error(result.payload as string);
  }, [dispatch, forecasts, generateKey, shouldRefresh]);

  // Принудительное обновление
  const refreshForecast = useCallback((params: FetchForecastParams) => {
    dispatch(forceRefreshForecast(params));
    return dispatch(fetchForecast(params));
  }, [dispatch]);

  // Инвалидация кэша
  const invalidate = useCallback((params: FetchForecastParams) => {
    dispatch(invalidateForecast(params));
  }, [dispatch]);

  // Получение прогноза из кэша без загрузки
  const getCachedForecast = useCallback((params: FetchForecastParams) => {
    const key = generateKey(params);
    return forecasts[key] || null;
  }, [forecasts, generateKey]);

  // Получение всех прогнозов для объекта
  const getObjectForecasts = useCallback((objectId: string, objectType: 'ctp' | 'unom') => {
    return Object.values(forecasts).filter(
      forecast => forecast.objectId === objectId && forecast.objectType === objectType
    );
  }, [forecasts]);

  return {
    // Данные
    forecasts,
    loading,
    error,
    
    // Методы
    getForecast,
    refreshForecast,
    invalidate,
    getCachedForecast,
    getObjectForecasts,
    
    // Утилиты
    shouldRefresh: (params: FetchForecastParams) => 
      shouldRefresh(generateKey(params), params.period),
    
    // Селекторы
    hasForecast: (params: FetchForecastParams) => 
      !!forecasts[generateKey(params)],
  };
};