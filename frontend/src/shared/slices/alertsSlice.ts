// slices/alertsSlice.ts
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { Alert } from '../types/alert.types';

interface AlertsState {
  alerts: Alert[];
  isLoading: boolean;
  error: string | null;
  lastUpdated: string | null;
  filterByAlerts: boolean;
  currentTimestamp: string | null; // Добавляем поле для хранения текущего timestamp
}

const initialState: AlertsState = {
  alerts: [],
  isLoading: false,
  error: null,
  lastUpdated: null,
  filterByAlerts: false,
  currentTimestamp: null, // Инициализируем как null
};

export const alertsSlice = createSlice({
  name: 'alerts',
  initialState,
  reducers: {
    // Начало загрузки алертов с timestamp
    fetchAlertsStart: (state, action: PayloadAction<string | undefined>) => {
      state.isLoading = true;
      state.error = null;
      // Сохраняем timestamp из фильтров
      if (action.payload) {
        state.currentTimestamp = action.payload;
      }
    },
    
    // Успешная загрузка алертов с timestamp
    fetchAlertsSuccess: (state, action: PayloadAction<{ alerts: Alert[]; timestamp?: string }>) => {
      const { alerts, timestamp } = action.payload;
      state.alerts = alerts;
      state.isLoading = false;
      state.error = null;
      state.lastUpdated = new Date().toISOString();
      // Сохраняем timestamp из фильтров
      if (timestamp) {
        state.currentTimestamp = timestamp;
      }
    },
    
    // Ошибка загрузки алертов с timestamp
    fetchAlertsError: (state, action: PayloadAction<{ error: string; timestamp?: string }>) => {
      const { error, timestamp } = action.payload;
      state.isLoading = false;
      state.error = error;
      state.alerts = [];
      // Сохраняем timestamp из фильтров даже при ошибке
      if (timestamp) {
        state.currentTimestamp = timestamp;
      }
    },
    
    // Очистка алертов
    clearAlerts: (state) => {
      state.alerts = [];
      state.error = null;
      state.lastUpdated = null;
      state.currentTimestamp = null; // Очищаем timestamp
    },
    
    // Обновление отдельного алерта
    updateAlert: (state, action: PayloadAction<{ id: string; updates: Partial<Alert> }>) => {
      const { id, updates } = action.payload;
      const alertIndex = state.alerts.findIndex(alert => alert.id === id);
      if (alertIndex !== -1) {
        state.alerts[alertIndex] = { ...state.alerts[alertIndex], ...updates };
      }
    },
    
    // Удаление алерта
    removeAlert: (state, action: PayloadAction<string>) => {
      state.alerts = state.alerts.filter(alert => alert.id !== action.payload);
    },
    
    // Переключение фильтрации по алертам
    toggleFilterByAlerts: (state) => {
      state.filterByAlerts = !state.filterByAlerts;
    },
    
    // Установка значения фильтрации
    setFilterByAlerts: (state, action: PayloadAction<boolean>) => {
      state.filterByAlerts = action.payload;
    },
    
    // Установка timestamp вручную
    setCurrentTimestamp: (state, action: PayloadAction<string>) => {
      state.currentTimestamp = action.payload;
    },
    
    // Очистка timestamp
    clearCurrentTimestamp: (state) => {
      state.currentTimestamp = null;
    },
  },
});

export const {
  fetchAlertsStart,
  fetchAlertsSuccess,
  fetchAlertsError,
  clearAlerts,
  updateAlert,
  removeAlert,
  toggleFilterByAlerts,
  setFilterByAlerts,
  setCurrentTimestamp,
  clearCurrentTimestamp,
} = alertsSlice.actions;

export default alertsSlice.reducer;