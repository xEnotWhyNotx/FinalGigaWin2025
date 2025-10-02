# 🔒 HTTPS конфигурация GigaWin 2025

## 📋 Обзор

Проект полностью настроен для работы с HTTPS как в production, так и при локальной разработке.

## 🏗️ Архитектура HTTPS

### Локальное развертывание (Docker Compose)

```
┌─────────────────────────────────────────────┐
│         Браузер (https://localhost:3017)    │
└─────────────────┬───────────────────────────┘
                  │ HTTPS
                  ▼
┌─────────────────────────────────────────────┐
│  Nginx Container (SSL Termination)          │
│  - Слушает: 443 (SSL) → порт 3017          │
│  - Слушает: 80 (HTTP) → порт 3080          │
│  - SSL сертификат: самоподписанный         │
│  - Проксирует /api → backend:5001 (HTTPS)  │
│  - Проксирует / → frontend:3000 (HTTP)     │
└─────────┬───────────────────┬───────────────┘
          │ HTTPS             │ HTTP
          ▼                   ▼
┌──────────────────┐  ┌──────────────────┐
│ Backend:5001     │  │ Frontend:3000    │
│ (HTTPS/SSL)      │  │ (HTTP internal)  │
└──────────────────┘  └──────────────────┘
```

### Production развертывание

```
┌─────────────────────────────────────────────────────┐
│  Браузер (https://gigawin.unicorns-group.ru)        │
└─────────────────┬───────────────────────────────────┘
                  │ HTTPS
                  ▼
┌─────────────────────────────────────────────────────┐
│  Внешний прокси / Portainer (SSL терминация)        │
│  - Получает реальный SSL сертификат                 │
└─────────────────┬───────────────────────────────────┘
                  │ HTTP/HTTPS
                  ▼
┌─────────────────────────────────────────────────────┐
│  Nginx Container                                     │
│  - Проксирует /api → backend:5001 (HTTPS)          │
│  - Проксирует / → frontend:3000 (HTTP)             │
└─────────┬───────────────────┬───────────────────────┘
          │ HTTPS             │ HTTP
          ▼                   ▼
┌──────────────────┐  ┌──────────────────┐
│ Backend:5001     │  │ Frontend:3000    │
│ (HTTPS/SSL)      │  │ (HTTP internal)  │
└──────────────────┘  └──────────────────┘
```

## 🔑 SSL Сертификаты

### Nginx SSL сертификат

**Генерируется в**: `Dockerfile.nginx`

```dockerfile
RUN openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /etc/nginx/ssl/key.pem \
    -out /etc/nginx/ssl/cert.pem \
    -subj "/C=RU/ST=Moscow/L=Moscow/O=GigaWin/CN=gigawin.unicorns-group.ru" \
    -addext "subjectAltName=DNS:gigawin.unicorns-group.ru,DNS:10.8.0.17,DNS:localhost,IP:10.8.0.17,IP:127.0.0.1"
```

**Параметры:**
- Тип: Самоподписанный (Self-signed)
- Алгоритм: RSA 2048 бит
- Срок действия: 365 дней
- Subject Alternative Names (SANs):
  - `gigawin.unicorns-group.ru`
  - `10.8.0.17`
  - `localhost`
  - `127.0.0.1`

### Backend SSL сертификат

**Генерируется в**: `backend/Dockerfile.ssl`

```dockerfile
RUN openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /app/ssl/key.pem -out /app/ssl/cert.pem \
    -subj "/C=RU/ST=Moscow/L=Moscow/O=GigaWin/CN=gigawin.unicorns-group.ru" \
    -addext "subjectAltName=DNS:gigawin.unicorns-group.ru,DNS:backend,DNS:localhost,DNS:10.8.0.17,IP:127.0.0.1,IP:10.8.0.17"
```

**Параметры:** Аналогичны nginx сертификату + дополнительно `DNS:backend` для внутренней Docker сети.

## ⚙️ Nginx конфигурация

### HTTP сервер (порт 80 → 3080)

- Предоставляет `/health` endpoint
- Редиректит все остальные запросы на HTTPS

```nginx
server {
    listen 80;
    server_name gigawin.unicorns-group.ru 10.8.0.17 localhost;
    
    location /health {
        return 200 "healthy\n";
    }
    
    location / {
        # Редирект на HTTPS с правильным портом
        return 301 https://$host:3017$request_uri;
    }
}
```

### HTTPS сервер (порт 443 → 3017)

- SSL терминация
- Проксирование на backend и frontend

```nginx
server {
    listen 443 ssl;
    server_name gigawin.unicorns-group.ru 10.8.0.17 localhost;
    
    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    
    location /api/ {
        proxy_pass https://backend/;  # HTTPS к backend
        proxy_ssl_verify off;  # Отключаем проверку самоподписанного сертификата
    }
    
    location / {
        proxy_pass http://frontend/;  # HTTP к frontend (внутренняя сеть)
    }
}
```

## 🌐 Frontend API конфигурация

**Файл**: `frontend/src/shared/config/api.ts`

### Логика определения API URL:

1. **HTTPS режим** (любой HTTPS хост):
   - Использует относительный путь `/api`
   - Nginx проксирует на backend

2. **HTTP режим на порту 3080**:
   - Автоматически редиректит на `https://localhost:3017`

3. **HTTP режим (dev без Docker)**:
   - Использует `http://localhost:5001` (прямое подключение к backend)

```typescript
const getApiUrl = () => {
  const protocol = window.location.protocol;
  const port = window.location.port;
  
  if (protocol === 'https:') {
    return '/api';  // Проксируется через nginx
  }
  
  if (port === '3080') {
    // Редирект на HTTPS
    window.location.href = `https://localhost:3017${window.location.pathname}`;
    return '/api';
  }
  
  // Локальная разработка
  return 'http://localhost:5001';
};
```

## 🐳 Docker Compose конфигурация

### Порты

```yaml
nginx:
  ports:
    - "3017:443"  # HTTPS → внешний порт 3017
    - "3080:80"   # HTTP → внешний порт 3080
```

### Backend переменные окружения

```yaml
backend:
  environment:
    - SSL_ENABLED=true
    - CORS_ALLOWED_ORIGINS=https://gigawin.unicorns-group.ru,https://10.8.0.17:3017,https://localhost:3017
```

## 🔧 Отключение SSL (не рекомендуется)

Если по какой-то причине нужно отключить SSL для локальной разработки:

1. **Изменить `docker-compose.yaml`:**
```yaml
backend:
  environment:
    - SSL_ENABLED=false
```

2. **Изменить `nginx.conf`:**
```nginx
location /api/ {
    proxy_pass http://backend:5001/;  # Изменить на http
}
```

3. **Изменить маппинг портов:**
```yaml
nginx:
  ports:
    - "3017:80"  # Маппить 3017 на HTTP порт
```

⚠️ **Не рекомендуется**: это нарушает production-like окружение.

## 📝 Проверка SSL

### Проверка сертификата nginx:

```bash
# Внутри контейнера nginx
docker exec gigawin-nginx openssl x509 -in /etc/nginx/ssl/cert.pem -text -noout

# Проверка с хоста
openssl s_client -connect localhost:3017 -showcerts
```

### Проверка сертификата backend:

```bash
# Внутри контейнера backend
docker exec gigawin-backend openssl x509 -in /app/ssl/cert.pem -text -noout
```

### Проверка HTTPS соединения:

```bash
# Проверка через curl
curl -k https://localhost:3017/api/health

# Проверка с выводом деталей SSL
curl -kv https://localhost:3017/api/health
```

## 🔐 Безопасность

### Самоподписанные сертификаты (Development)

✅ **Плюсы:**
- Быстрая настройка
- Не требуют внешних сервисов
- Production-like окружение

⚠️ **Минусы:**
- Предупреждения браузера
- Не подходят для production
- Требуют ручного принятия

### Production сертификаты

Для production рекомендуется использовать:
- **Let's Encrypt** (бесплатно, автообновление)
- **Коммерческие CA** (для корпоративных нужд)

## 📚 Дополнительные ресурсы

- [Mozilla SSL Configuration Generator](https://ssl-config.mozilla.org/)
- [Let's Encrypt Documentation](https://letsencrypt.org/docs/)
- [Nginx SSL Configuration](https://nginx.org/en/docs/http/configuring_https_servers.html)

---

**Вопросы? См. [LOCAL_DEPLOYMENT.md](LOCAL_DEPLOYMENT.md) для инструкций по запуску**

