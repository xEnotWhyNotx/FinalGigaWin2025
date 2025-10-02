// config/api.ts - Production version for HTTPS deployment
const getApiUrl = () => {
  const hostname = window.location.hostname;
  const protocol = window.location.protocol;
  const port = window.location.port;
  
  // HTTPS режим (production и локальный запуск через docker-compose)
  if (protocol === 'https:') {
    // Localhost через docker-compose nginx (порт 3017)
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      // Используем относительный путь /api, который проксируется nginx
      return '/api';
    }
    
    // Production домен
    if (hostname === 'gigawin.unicorns-group.ru') {
      return '/api';
    }
    
    // VPN адрес
    if (hostname === '10.8.0.17') {
      return '/api';
    }
    
    // Для любого другого HTTPS домена - используем относительный путь
    return '/api';
  }
  
  // HTTP режим (только для разработки без docker)
  if (protocol === 'http:') {
    // Если запущено через docker-compose на порту 3080 - редиректим на HTTPS
    if (port === '3080') {
      window.location.href = `https://${hostname}:3017${window.location.pathname}${window.location.search}`;
      return '/api';
    }
    
    // Локальная разработка без docker (npm run dev)
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:5001';
    }
  }
  
  // Fallback - относительный путь через nginx
  return '/api';
};

export const API_CONFIG = {
  baseURL: getApiUrl(),
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
};

export default API_CONFIG;