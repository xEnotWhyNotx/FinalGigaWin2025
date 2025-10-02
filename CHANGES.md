# Список изменений для HTTPS деплоя в Portainer

## Дата: 2025-10-03

## Общее описание

Проект полностью переведен на HTTPS и подготовлен для деплоя в Portainer с использованием внешнего домена `gigawin.unicorns-group.ru` и VPN адреса `10.8.0.17:3017`.

## Ключевые изменения

### 1. Nginx конфигурация (nginx.conf)

**Изменения:**
- ✅ Добавлена полная поддержка HTTPS на порту 443
- ✅ Настроен редирект с HTTP (80) на HTTPS (443)
- ✅ Добавлены SSL сертификаты (самоподписанные)
- ✅ Настроен reverse proxy для backend API (/api → backend:5001)
- ✅ Настроен reverse proxy для frontend (/ → frontend:3000)
- ✅ Добавлены CORS headers для кросс-доменных запросов
- ✅ Добавлен health check endpoint
- ✅ Увеличены таймауты и размеры буферов

**Конфигурация:**
```nginx
location /api/ → proxy_pass https://backend/
location / → proxy_pass http://frontend/
```

### 2. Docker Compose (docker-compose.yaml)

**Изменения:**
- ✅ Добавлен nginx сервис с HTTPS
- ✅ Изменены порты: 3017:443 (HTTPS), 3080:80 (HTTP redirect)
- ✅ Добавлены build contexts для всех сервисов
- ✅ Backend и frontend используют expose вместо ports (внутренние порты)
- ✅ Обновлены environment variables для HTTPS
- ✅ Добавлены healthcheck для всех сервисов
- ✅ Настроена изолированная Docker сеть `gigawin-network`

**Сервисы:**
1. `nginx` - Reverse proxy с HTTPS (порт 3017)
2. `backend` - Flask API с HTTPS (внутренний порт 5001)
3. `frontend` - React SPA (внутренний порт 3000)
4. `telegram-bot` - Telegram бот

### 3. Dockerfile.nginx

**Изменения:**
- ✅ Добавлена установка OpenSSL
- ✅ Автоматическая генерация самоподписанного SSL сертификата
- ✅ Добавлены SAN (Subject Alternative Names) для всех доменов
- ✅ Изменен путь к конфигу: nginx.conf вместо nginx-proxy.conf
- ✅ Добавлена проверка конфигурации при сборке

**SSL сертификат:**
- CN: gigawin.unicorns-group.ru
- SAN: gigawin.unicorns-group.ru, 10.8.0.17, localhost, 127.0.0.1

### 4. Backend (backend/app.py)

**Изменения:**
- ✅ Обновлены CORS origins - только HTTPS (кроме localhost)
- ✅ Добавлены expose_headers для авторизации
- ✅ Улучшена настройка CORS для production
- ✅ Добавлена поддержка X-Forwarded-* headers

**CORS Origins:**
```python
https://gigawin.unicorns-group.ru
https://10.8.0.17:3017
https://10.8.0.17
http://localhost:3000  # Только для разработки
```

### 5. Backend Dockerfile (backend/Dockerfile.ssl)

**Изменения:**
- ✅ Обновлен SSL сертификат с правильными SAN
- ✅ Добавлен DNS: backend для Docker сети
- ✅ Удалено создание telegram_config.json (используется внешний)
- ✅ Gunicorn запускается с SSL сертификатами

### 6. Telegram Bot (backend/telegram_bot.py)

**Изменения:**
- ✅ Изменен default API URL на HTTPS
- ✅ Добавлено свойство `ssl_verify = False`
- ✅ Все requests вызовы обновлены с параметром `verify=self.ssl_verify`
- ✅ Поддержка самоподписанных сертификатов

**API запросы:**
```python
requests.get(..., verify=self.ssl_verify)
requests.post(..., verify=self.ssl_verify)
```

### 7. Telegram Config (configs/telegram_config.json)

**Изменения:**
- ✅ API URL изменен на HTTPS: `https://backend:5001`

### 8. Telegram Dockerfile (backend/Dockerfile.telegram.standalone)

**Изменения:**
- ✅ API URL в конфиге изменен на HTTPS

### 9. Frontend API Config (frontend/src/shared/config/api.ts)

**Изменения:**
- ✅ Полностью переписана логика определения API URL
- ✅ Для production: используется относительный путь `/api` через nginx
- ✅ Для VPN: `https://10.8.0.17:3017/api`
- ✅ Для домена: `https://gigawin.unicorns-group.ru/api`
- ✅ Увеличен timeout до 30 секунд

**Логика:**
```typescript
if (hostname === 'gigawin.unicorns-group.ru')
  → 'https://gigawin.unicorns-group.ru/api'
if (hostname === '10.8.0.17' && port === '3017')
  → 'https://10.8.0.17:3017/api'
else
  → '/api' (относительный путь через nginx)
```

### 10. Frontend Vite Config (frontend/vite.config.ts)

**Изменения:**
- ✅ Добавлен `host: '0.0.0.0'` для Docker
- ✅ Proxy target изменен на HTTPS: `https://localhost:5001`
- ✅ Добавлен `secure: false` для самоподписанных сертификатов
- ✅ Добавлена конфигурация preview
- ✅ Отключены sourcemap для production

## Новые файлы

### 1. .dockerignore файлы
- ✅ `backend/.dockerignore` - игнорируемые файлы для backend
- ✅ `frontend/.dockerignore` - игнорируемые файлы для frontend
- ✅ `.dockerignore` - игнорируемые файлы для nginx

### 2. Документация
- ✅ `DEPLOYMENT.md` - полная инструкция по деплою
- ✅ `PORTAINER_DEPLOY.md` - краткая инструкция для Portainer
- ✅ `CHANGES.md` - этот файл с описанием изменений

## Архитектура HTTPS

```
                    Внешний мир
                         ↓
        gigawin.unicorns-group.ru (автопрокси)
                         ↓
              VPN 10.8.0.17:3017
                         ↓
                   Nginx (HTTPS)
                    /          \
                   /            \
            Frontend          Backend API
         (HTTP:3000)         (HTTPS:5001)
                                 ↓
                          Telegram Bot
```

## SSL сертификаты

### Уровень 1: Внешний (обрабатывается внешним прокси)
- Домен: gigawin.unicorns-group.ru
- Выдан: внешним провайдером/Let's Encrypt

### Уровень 2: Nginx (самоподписанный)
- Путь: `/etc/nginx/ssl/cert.pem`, `/etc/nginx/ssl/key.pem`
- Генерируется при сборке Docker образа
- Используется для HTTPS на порту 443

### Уровень 3: Backend (самоподписанный)
- Путь: `/app/ssl/cert.pem`, `/app/ssl/key.pem`
- Генерируется при сборке Docker образа
- Используется для HTTPS между nginx и backend

## Порты

| Сервис | Внутри Docker | Снаружи | Протокол | Описание |
|--------|---------------|---------|----------|----------|
| Nginx | 443 | 3017 | HTTPS | Основной вход |
| Nginx | 80 | 3080 | HTTP | Redirect на HTTPS |
| Backend | 5001 | - | HTTPS | Внутренний API |
| Frontend | 3000 | - | HTTP | Внутренний frontend |

## Переменные окружения

### Backend
```env
PYTHONUNBUFFERED=1
FLASK_ENV=production
FLASK_APP=app.py
SSL_ENABLED=true
CORS_ALLOWED_ORIGINS=https://gigawin.unicorns-group.ru,https://10.8.0.17:3017,https://10.8.0.17
```

### Telegram Bot
```env
PYTHONUNBUFFERED=1
PYTHONPATH=/app
DATA_PATH=/app/data
CONFIGS_PATH=/app/configs
HTTPS_BACKEND_URL=https://backend:5001
SSL_VERIFY=false
```

## Volumes

- `backend_data` - данные бекенда (БД, модели)
- `configs_volume` - конфигурационные файлы

## Networks

- `gigawin-network` - изолированная bridge сеть для всех сервисов

## Healthchecks

### Nginx
```bash
wget --no-verbose --tries=1 --spider http://localhost/health
```

### Backend
```bash
python -c "import requests; requests.get('https://localhost:5001/health', verify=False).raise_for_status()"
```

### Frontend
```bash
curl -f http://localhost:3000
```

## Безопасность

✅ Все внешние соединения используют HTTPS  
✅ HTTP автоматически редиректится на HTTPS  
✅ CORS настроен с whitelist origins  
✅ SSL сертификаты используются на всех уровнях  
✅ Контейнеры изолированы в отдельной сети  
✅ Volumes используются для персистентности данных  

## Тестирование

### Локальное тестирование
```bash
# Build
docker-compose build

# Start
docker-compose up -d

# Проверка
curl -k https://localhost:3017/health
curl -k https://localhost:3017/api/health
```

### Production тестирование
```bash
curl -k https://gigawin.unicorns-group.ru/health
curl -k https://gigawin.unicorns-group.ru/api/health
curl -k https://10.8.0.17:3017/health
```

## Что НЕ изменилось

- ✅ Бизнес-логика backend не изменена
- ✅ Frontend компоненты не изменены
- ✅ Модели ML не изменены
- ✅ Telegram bot логика не изменена
- ✅ База данных не изменена

## Совместимость

- ✅ Работает на любой ОС с Docker
- ✅ Совместимо с Portainer
- ✅ Поддержка Docker Compose v3.8+
- ✅ Поддержка Python 3.9+
- ✅ Поддержка Node.js 18+

## Проверено

- ✅ Все Dockerfile собираются без ошибок
- ✅ docker-compose.yaml синтаксически корректен
- ✅ nginx.conf синтаксически корректен
- ✅ API конфигурация фронтенда правильная
- ✅ CORS настроен корректно
- ✅ SSL сертификаты генерируются правильно
- ✅ Telegram bot использует HTTPS

## Готовность к production

✅ Готово к деплою в Portainer  
✅ Все конфигурации проверены  
✅ Документация создана  
✅ Инструкции по деплою готовы  

## Следующие шаги

1. Загрузить код в Git репозиторий
2. Создать Stack в Portainer
3. Выполнить деплой
4. Проверить работоспособность
5. Мониторить логи и метрики

---

**Дата завершения:** 3 октября 2025  
**Статус:** ✅ Готово к production деплою

