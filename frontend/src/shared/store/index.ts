// store/index.ts
import { configureStore } from '@reduxjs/toolkit';
import forecastReducer from '../slices/forecastSlice';
import alertsReducer from '../slices/alertsSlice';

export const store = configureStore({
  reducer: {
    forecast: forecastReducer,
    alerts: alertsReducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;