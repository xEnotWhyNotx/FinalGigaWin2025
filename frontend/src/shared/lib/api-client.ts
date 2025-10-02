// lib/api-client.ts
import axios from 'axios';
import { API_CONFIG } from '../config/api';

// Автоматическое определение базового URL для API запросов
const getApiBaseUrl = (): string => {
  // Используем конфигурацию из config/api.ts
  return API_CONFIG.baseURL;
};

const API_BASE_URL = getApiBaseUrl();

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000, // 60 секунд для первых запросов при инициализации
  headers: {
    'Content-Type': 'application/json',
  },
});

// Интерцептор для логирования запросов
apiClient.interceptors.request.use(
  (config) => {
    console.log('🔄 Making API request to:', config.url, 'with base URL:', config.baseURL);
    console.log('📍 Current location:', window.location.href);
    console.log('🌐 Hostname:', window.location.hostname, 'Port:', window.location.port);
    return config;
  }
);

// Интерцептор для логирования ответов
apiClient.interceptors.response.use(
  (response) => {
    console.log('✅ API Response:', response.status, 'from', response.config.url);
    return response;
  },
  (error) => {
    const currentLocation = window.location.href;
    const apiUrl = error.config?.baseURL || API_BASE_URL;
    const fullUrl = `${error.config?.baseURL || ''}${error.config?.url || ''}`;
    
    console.error('❌ API Error Details:', {
      currentLocation: currentLocation,
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      apiBaseUrl: apiUrl,
      requestUrl: error.config?.url,
      fullRequestUrl: fullUrl,
      hostname: window.location.hostname,
      port: window.location.port
    });
    
    // Улучшенная обработка ошибок для разных типов проблем
    if (error.code === 'ECONNREFUSED') {
      throw new Error(`❌ Не удалось подключиться к API серверу. Проверьте что backend запущен на ${apiUrl}`);
    }
    
    if (error.code === 'NETWORK_ERROR') {
      throw new Error(`❌ Ошибка сети. Проверьте подключение к интернету и доступность ${fullUrl}`);
    }
    
    throw new Error(
      error.response?.data?.error || 
      `❌ API Error (${error.response?.status || 'network'}): ${error.message || 'Unknown error'}`
    );
  }
);

// Экспорт базового URL для использования в других местах
export { API_BASE_URL };