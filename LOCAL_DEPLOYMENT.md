# 🏠 Локальный запуск GigaWin 2025 с HTTPS

## 📋 Требования

- Docker и Docker Compose
- Браузер с поддержкой самоподписанных сертификатов

## 🚀 Запуск проекта

### 1. Запуск всех сервисов

```bash
# Запуск всех контейнеров
docker-compose up -d

# Или с пересборкой образов
docker-compose up -d --build
```

### 2. Проверка статуса

```bash
# Проверка запущенных контейнеров
docker-compose ps

# Просмотр логов
docker-compose logs -f

# Просмотр логов отдельного сервиса
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f nginx
```

## 🌐 Доступ к приложению

### Главный адрес (HTTPS):
**https://localhost:3017**

При первом открытии браузер покажет предупреждение о самоподписанном сертификате. Это нормально для локальной разработки.

### Как принять самоподписанный сертификат:

#### Chrome/Edge:
1. Откройте https://localhost:3017
2. Нажмите "Дополнительно" / "Advanced"
3. Нажмите "Перейти на localhost (небезопасно)" / "Proceed to localhost (unsafe)"

#### Firefox:
1. Откройте https://localhost:3017
2. Нажмите "Дополнительно..." / "Advanced..."
3. Нажмите "Принять риск и продолжить" / "Accept the Risk and Continue"

### HTTP порт (редирект на HTTPS):
**http://localhost:3080** - автоматически перенаправит на https://localhost:3017

## 📊 Структура портов

| Сервис | Внутренний порт | Внешний порт | Протокол | Описание |
|--------|----------------|--------------|----------|----------|
| Nginx | 443 | 3017 | HTTPS | Главный вход (фронтенд + API) |
| Nginx | 80 | 3080 | HTTP | Редирект на HTTPS |
| Backend | 5001 | - | HTTPS | Backend API (внутри Docker сети) |
| Frontend | 3000 | - | HTTP | Frontend (внутри Docker сети) |

## 🔗 API Endpoints

Все API запросы идут через nginx на `/api/`:

- **https://localhost:3017/api/health** - проверка здоровья backend
- **https://localhost:3017/api/...** - все остальные API endpoints

Frontend автоматически определяет правильный API URL на основе протокола и хоста.

## 🛠️ Полезные команды

### Остановка сервисов:
```bash
docker-compose down
```

### Остановка с удалением volumes:
```bash
docker-compose down -v
```

### Пересборка образов:
```bash
docker-compose build
```

### Перезапуск одного сервиса:
```bash
docker-compose restart backend
docker-compose restart frontend
docker-compose restart nginx
```

### Просмотр логов в реальном времени:
```bash
docker-compose logs -f
```

## 🐛 Решение проблем

### Проблема: "Не могу подключиться к серверу"

**Решение:**
```bash
# Проверьте статус контейнеров
docker-compose ps

# Проверьте логи на ошибки
docker-compose logs

# Перезапустите сервисы
docker-compose restart
```

### Проблема: "ERR_SSL_PROTOCOL_ERROR" или "SEC_ERROR_UNKNOWN_ISSUER"

**Решение:**
Это нормально для самоподписанных сертификатов. Примите предупреждение браузера как описано выше в разделе "Как принять самоподписанный сертификат".

### Проблема: Backend не отвечает

**Решение:**
```bash
# Проверьте логи backend
docker-compose logs backend

# Перезапустите backend
docker-compose restart backend

# Проверьте здоровье через nginx
curl -k https://localhost:3017/api/health
```

### Проблема: Frontend показывает ошибки подключения к API

**Решение:**
```bash
# Убедитесь что вы используете HTTPS
# Откройте: https://localhost:3017 (не http://)

# Проверьте что backend запущен
docker-compose ps backend

# Проверьте логи nginx
docker-compose logs nginx
```

### Проблема: Порт уже занят

**Решение:**
```bash
# Проверьте какие порты заняты
# Windows PowerShell:
netstat -ano | findstr :3017
netstat -ano | findstr :3080

# Остановите процесс использующий порт или измените порты в docker-compose.yaml
```

## 📦 Архитектура

```
┌─────────────────────────────────────────────────────────┐
│                      Браузер                             │
│             https://localhost:3017                       │
└───────────────────────┬─────────────────────────────────┘
                        │ HTTPS
                        ▼
┌─────────────────────────────────────────────────────────┐
│                  Nginx (Port 3017)                       │
│                  SSL Termination                         │
│                  Reverse Proxy                           │
└───────────┬─────────────────────┬───────────────────────┘
            │                     │
            │ /api/ → HTTPS       │ / → HTTP
            │                     │
            ▼                     ▼
┌─────────────────────┐   ┌─────────────────────┐
│   Backend (5001)    │   │  Frontend (3000)    │
│   Flask + HTTPS     │   │  React + Vite       │
│   + ML Models       │   │  Static Files       │
└─────────────────────┘   └─────────────────────┘
```

## 🔒 SSL Сертификаты

SSL сертификаты генерируются автоматически при сборке Docker образов:

- **Nginx SSL**: `/etc/nginx/ssl/cert.pem` и `/etc/nginx/ssl/key.pem`
- **Backend SSL**: `/app/ssl/cert.pem` и `/app/ssl/key.pem`

Сертификаты действительны для:
- `gigawin.unicorns-group.ru`
- `10.8.0.17`
- `localhost`
- `127.0.0.1`

Срок действия: **365 дней**

⚠️ **ВАЖНО**: Эти сертификаты самоподписанные и предназначены ТОЛЬКО для разработки и тестирования!

## 📝 Переменные окружения

Backend использует следующие переменные:
- `SSL_ENABLED=true` - включает HTTPS режим
- `CORS_ALLOWED_ORIGINS` - разрешенные origins для CORS

Для изменения настроек отредактируйте `docker-compose.yaml`.

## 🎯 Что дальше?

После успешного запуска вы можете:
1. Открыть приложение по адресу https://localhost:3017
2. Войти в систему или зарегистрироваться
3. Изучать карту с данными МКД
4. Просматривать аналитику и прогнозы
5. Работать с системой оповещений

---

**Готово! Ваш локальный GigaWin 2025 запущен с полной HTTPS поддержкой! 🚀🔒**

