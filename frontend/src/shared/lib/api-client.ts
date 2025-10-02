// lib/api-client.ts
import axios from 'axios';

// Для разработки используем proxy путь, для продакшена - прямой URL
const API_BASE_URL = 'http://localhost:5001'

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Интерцептор для логирования
apiClient.interceptors.request.use(
  (config) => {
    console.log('🔄 Making request to:', config.url);
    return config;
  }
);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('❌ API Error:', {
      message: error.message,
      status: error.response?.status,
      url: error.config?.url
    });
    
    throw new Error(
      error.response?.data?.error || 
      error.message || 
      'Network error'
    );
  }
);