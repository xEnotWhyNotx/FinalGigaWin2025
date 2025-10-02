# 🔧 Решение проблем GigaWin 2025

## 🚨 Частые проблемы и решения

### 1. Не могу подключиться к https://localhost:3017

#### Симптомы:
- "Не удается установить соединение"
- "ERR_CONNECTION_REFUSED"

#### Решение:

```bash
# Проверьте статус контейнеров
docker-compose ps

# Должны быть запущены все 3 контейнера:
# - gigawin-backend (healthy)
# - gigawin-frontend (healthy)
# - gigawin-nginx (healthy)

# Если контейнеры не запущены:
docker-compose up -d

# Проверьте логи nginx
docker-compose logs nginx

# Проверьте что порт 3017 свободен (Windows PowerShell):
netstat -ano | findstr :3017
```

---

### 2. Браузер показывает "Ваше подключение не защищено" / "Your connection is not private"

#### Симптомы:
- `NET::ERR_CERT_AUTHORITY_INVALID`
- `SEC_ERROR_UNKNOWN_ISSUER`
- Предупреждение о самоподписанном сертификате

#### Решение:

✅ **Это нормально для локальной разработки!**

**Chrome/Edge:**
1. Нажмите "Дополнительно" / "Advanced"
2. Нажмите "Перейти на localhost (небезопасно)" / "Proceed to localhost (unsafe)"

**Firefox:**
1. Нажмите "Дополнительно..." / "Advanced..."
2. Нажмите "Принять риск и продолжить" / "Accept the Risk and Continue"

**Альтернатива - добавить исключение навсегда:**

Chrome:
- Откройте `chrome://flags/#allow-insecure-localhost`
- Включите "Allow invalid certificates for resources loaded from localhost"

---

### 3. Frontend не может подключиться к Backend (Network Error)

#### Симптомы:
- "Network Error" в консоли браузера
- API запросы не проходят
- 502 Bad Gateway

#### Диагностика:

```bash
# 1. Проверьте здоровье backend
curl -k https://localhost:3017/api/health

# Ожидаемый ответ: {"status": "healthy"}

# 2. Проверьте логи backend
docker-compose logs backend

# 3. Проверьте CORS в логах
docker-compose logs backend | grep CORS

# 4. Проверьте nginx проксирование
docker-compose logs nginx | grep api
```

#### Решение:

```bash
# Перезапустите backend
docker-compose restart backend

# Проверьте что SSL_ENABLED=true
docker-compose exec backend env | grep SSL

# Проверьте внутреннюю связь
docker-compose exec nginx wget --no-check-certificate -O- https://backend:5001/health
```

---

### 4. Порт 3017 или 3080 уже занят

#### Симптомы:
- "Bind for 0.0.0.0:3017 failed: port is already allocated"

#### Решение:

**Windows PowerShell:**
```powershell
# Найти процесс использующий порт
netstat -ano | findstr :3017

# Остановить процесс (замените PID на номер из предыдущей команды)
taskkill /PID <PID> /F

# Или измените порт в docker-compose.yaml:
# ports:
#   - "3018:443"  # вместо 3017
```

**Linux/Mac:**
```bash
# Найти процесс
lsof -i :3017

# Остановить процесс
kill -9 <PID>
```

---

### 5. Backend контейнер не запускается (Unhealthy)

#### Симптомы:
- `gigawin-backend` показывает статус "unhealthy"
- Backend не отвечает на health check

#### Диагностика:

```bash
# Проверьте логи backend
docker-compose logs backend

# Типичные ошибки:
# - "SSL certificate not found" → проблема с сертификатом
# - "Database locked" → проблема с базой данных
# - "ModuleNotFoundError" → отсутствуют зависимости
```

#### Решение:

```bash
# Пересоберите backend образ
docker-compose build backend

# Запустите заново
docker-compose up -d backend

# Проверьте SSL сертификаты внутри контейнера
docker-compose exec backend ls -la /app/ssl/

# Должны быть файлы:
# - cert.pem
# - key.pem
```

---

### 6. База данных не инициализирована

#### Симптомы:
- "no such table" в логах
- 500 Internal Server Error при запросах

#### Решение:

```bash
# Войдите в контейнер backend
docker-compose exec backend bash

# Запустите инициализацию БД вручную
python init_db.py

# Выйдите и перезапустите backend
exit
docker-compose restart backend
```

---

### 7. Frontend показывает белую страницу

#### Симптомы:
- Белый экран
- Нет ошибок в консоли (или минимальные)

#### Диагностика:

```bash
# Проверьте логи frontend
docker-compose logs frontend

# Проверьте что nginx проксирует frontend
docker-compose exec nginx wget -O- http://frontend:3000

# Откройте консоль браузера (F12)
# Проверьте вкладку Network на ошибки
```

#### Решение:

```bash
# Перезапустите frontend
docker-compose restart frontend

# Если не помогло - пересоберите
docker-compose build frontend
docker-compose up -d frontend
```

---

### 8. Медленная работа / Таймауты

#### Симптомы:
- Запросы выполняются очень долго
- Timeout errors

#### Решение:

```bash
# Проверьте ресурсы Docker
docker stats

# Увеличьте таймауты в docker-compose.yaml
# backend:
#   deploy:
#     resources:
#       limits:
#         memory: 2G

# Или в nginx.conf:
# proxy_read_timeout 600;
```

---

### 9. CORS ошибки в консоли

#### Симптомы:
- "Access to fetch at '...' has been blocked by CORS policy"
- "No 'Access-Control-Allow-Origin' header"

#### Решение:

```bash
# Проверьте что запросы идут через /api
# В консоли браузера (F12 → Network):
# Запросы должны быть к: https://localhost:3017/api/...
# А НЕ к: https://localhost:5001/...

# Проверьте CORS_ALLOWED_ORIGINS в docker-compose.yaml
docker-compose config | grep CORS_ALLOWED_ORIGINS

# Должен включать: https://localhost:3017
```

---

### 10. Telegram бот не работает

#### Симптомы:
- Бот не отвечает
- "Connection refused" в логах

#### Диагностика:

```bash
# Проверьте логи telegram-bot
docker-compose logs telegram-bot

# Проверьте конфигурацию
docker-compose exec telegram-bot cat /app/configs/telegram_config.json
```

#### Решение:

```bash
# Убедитесь что backend доступен
docker-compose exec telegram-bot wget --no-check-certificate -O- https://backend:5001/health

# Перезапустите бота
docker-compose restart telegram-bot

# Проверьте токен в telegram_config.json
```

---

## 🔍 Полезные команды для диагностики

### Просмотр логов

```bash
# Все сервисы
docker-compose logs -f

# Конкретный сервис
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f nginx

# Последние N строк
docker-compose logs --tail=100 backend

# С фильтрацией
docker-compose logs backend | grep ERROR
```

### Проверка статуса

```bash
# Статус всех контейнеров
docker-compose ps

# Детальная информация
docker-compose ps -a

# Использование ресурсов
docker stats
```

### Проверка сети

```bash
# Внутри контейнера
docker-compose exec backend ping frontend
docker-compose exec nginx ping backend

# Проверка портов
docker-compose exec nginx netstat -tlnp

# DNS разрешение
docker-compose exec backend nslookup backend
```

### Проверка volumes

```bash
# Список volumes
docker volume ls

# Детальная информация
docker volume inspect gigawin2025_backend_data

# Очистка неиспользуемых volumes
docker volume prune
```

### Проверка SSL

```bash
# Проверка сертификата nginx
docker-compose exec nginx openssl x509 -in /etc/nginx/ssl/cert.pem -text -noout

# Проверка сертификата backend
docker-compose exec backend openssl x509 -in /app/ssl/cert.pem -text -noout

# Проверка SSL соединения с хоста
openssl s_client -connect localhost:3017 -showcerts

# Проверка через curl
curl -kv https://localhost:3017/api/health
```

### Вход в контейнер

```bash
# Backend
docker-compose exec backend bash

# Frontend (если нужно)
docker-compose exec frontend sh

# Nginx
docker-compose exec nginx sh
```

### Полная переустановка

```bash
# Остановить все контейнеры
docker-compose down

# Удалить volumes (ОСТОРОЖНО - удалятся данные!)
docker-compose down -v

# Удалить образы
docker-compose down --rmi all

# Пересобрать с нуля
docker-compose build --no-cache

# Запустить заново
docker-compose up -d
```

## 📞 Нужна дополнительная помощь?

1. Соберите диагностическую информацию:
```bash
# Сохраните в файл
docker-compose ps > debug.txt
docker-compose logs >> debug.txt
docker stats --no-stream >> debug.txt
```

2. Проверьте документацию:
- [QUICKSTART.md](QUICKSTART.md) - Быстрый старт
- [LOCAL_DEPLOYMENT.md](LOCAL_DEPLOYMENT.md) - Полная инструкция
- [HTTPS_SETUP.md](HTTPS_SETUP.md) - Детали HTTPS конфигурации

3. Общие рекомендации:
- Убедитесь что Docker Desktop запущен
- Проверьте что есть свободное место на диске
- Попробуйте перезапустить Docker Desktop
- Проверьте что нет конфликтов портов

---

**Удачи в отладке! 🚀**

