# Быстрый деплой в Portainer

## Краткая инструкция

### 1. Подготовка

Убедитесь, что у вас есть доступ к:
- Portainer Web UI
- Git репозиторий с кодом проекта
- Сервер с Docker и Docker Compose

### 2. Создание Stack в Portainer

1. **Войдите в Portainer** → выберите Environment
2. **Перейдите в Stacks** → нажмите **"Add stack"**
3. **Название**: `gigawin2025`
4. **Build method**: выберите один из вариантов:

#### Вариант A: Git Repository (рекомендуется)

```
Repository URL: <ваш git репозиторий>
Reference: main
Compose path: docker-compose.yaml
```

✅ Включите **"Authentication"**, если репозиторий приватный

#### Вариант B: Web editor

1. Скопируйте содержимое файла `docker-compose.yaml`
2. Вставьте в Web Editor
3. Убедитесь, что build paths указаны правильно

### 3. Environment Variables (необязательно)

Можно оставить пустым - используются значения по умолчанию.

Если нужны кастомные настройки:
```env
FLASK_ENV=production
CORS_ALLOWED_ORIGINS=https://gigawin.unicorns-group.ru,https://10.8.0.17:3017
```

### 4. Деплой

1. Нажмите **"Deploy the stack"**
2. Дождитесь завершения (5-10 минут):
   - ✅ Building images
   - ✅ Creating containers
   - ✅ Starting containers
   - ✅ Health checks

### 5. Проверка

#### Статус контейнеров
В Portainer все 4 контейнера должны быть **Running**:
- ✅ `gigawin-nginx` (зеленый)
- ✅ `gigawin-backend` (зеленый)
- ✅ `gigawin-frontend` (зеленый)
- ✅ `gigawin-telegram-bot` (зеленый)

#### Тестирование доступности

**В браузере:**
```
https://gigawin.unicorns-group.ru
https://10.8.0.17:3017
```

**В терминале:**
```bash
# Health check
curl -k https://gigawin.unicorns-group.ru/health

# API health
curl -k https://gigawin.unicorns-group.ru/api/health

# Frontend
curl -k https://gigawin.unicorns-group.ru/
```

Ожидаемый результат: HTTP 200 OK

### 6. Просмотр логов

Если что-то не работает:
1. В Portainer выберите контейнер
2. Нажмите **"Logs"**
3. Проверьте последние сообщения

## Структура проекта

```
GigaWin2025/
├── docker-compose.yaml          # Главный файл для Portainer
├── Dockerfile.nginx             # Nginx с HTTPS
├── nginx.conf                   # Конфигурация nginx
├── backend/
│   ├── Dockerfile.ssl           # Backend с HTTPS
│   ├── Dockerfile.telegram.standalone
│   ├── app.py                   # Flask API
│   └── ...
├── frontend/
│   ├── Dockerfile               # Frontend React
│   └── ...
└── configs/
    └── telegram_config.json     # Конфиг Telegram бота
```

## Порты

| Сервис | Внутренний | Внешний | Протокол |
|--------|-----------|---------|----------|
| Nginx HTTPS | 443 | 3017 | HTTPS |
| Nginx HTTP | 80 | 3080 | HTTP (redirect) |
| Backend | 5001 | - | HTTPS (internal) |
| Frontend | 3000 | - | HTTP (internal) |

## Доступ

- **Production**: `https://gigawin.unicorns-group.ru`
- **VPN**: `https://10.8.0.17:3017`

## Обновление

### После изменения кода:

**В Portainer:**
1. Stacks → `gigawin2025`
2. Нажмите **"Update the stack"**
3. Выберите **"Re-pull image and redeploy"**
4. Нажмите **"Update"**

**Или через Git (если используется Git repository):**
1. Push изменения в репозиторий
2. В Portainer: **"Pull and redeploy"**

## Troubleshooting

### Контейнер не запускается
1. Проверьте логи контейнера
2. Убедитесь, что порты 3017 и 3080 свободны:
   ```bash
   netstat -tulpn | grep -E '3017|3080'
   ```

### 502 Bad Gateway
1. Проверьте, что backend и frontend запущены
2. Проверьте healthcheck:
   ```bash
   docker ps | grep gigawin
   ```

### CORS ошибки
Проверьте в логах backend:
```bash
docker logs gigawin-backend | grep CORS
```

### SSL предупреждения
Это нормально для самоподписанных сертификатов. В браузере:
1. Нажмите "Advanced"
2. "Proceed to site (unsafe)"

## Важные команды

```bash
# Просмотр всех контейнеров
docker ps -a | grep gigawin

# Логи всех сервисов
docker-compose logs -f

# Перезапуск конкретного сервиса
docker restart gigawin-backend

# Остановка всех сервисов
docker-compose down

# Полная переустановка (удаление volumes)
docker-compose down -v
docker-compose up -d --build
```

## Контакты и поддержка

- Полная документация: `DEPLOYMENT.md`
- README проекта: `README.md`

## Checklist перед деплоем

- [ ] Docker и Docker Compose установлены
- [ ] Portainer настроен и доступен
- [ ] Порты 3017 и 3080 свободны
- [ ] Git репозиторий доступен (если используется)
- [ ] VPN настроен (для 10.8.0.17)
- [ ] Домен gigawin.unicorns-group.ru настроен

## После успешного деплоя

✅ Все 4 контейнера работают  
✅ Frontend доступен по HTTPS  
✅ Backend API отвечает  
✅ Healthcheck проходит  
✅ Telegram bot подключен  

**Готово! Приложение развернуто и работает! 🚀**

