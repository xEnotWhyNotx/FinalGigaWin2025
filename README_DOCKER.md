# Docker Setup для GigaWin2025

## 🔧 Исправленные проблемы

### ✅ **Telegram Bot конфигурация**
- Исправлен путь к конфигурации: теперь ищет в `/app/configs/telegram_config.json`
- Обновлен `api_base_url` для работы с Docker: `http://backend:5001`
- Добавлена защита от множественных запусков через lock файл

### ✅ **Health Checks**
- Добавлен `/health` endpoint в backend API
- Настроены healthchecks для всех сервисов
- Backend использует Python requests для проверки
- Frontend использует wget для проверки доступности

### ✅ **Автоматические перезапуски**
- Telegram bot настроен на `restart: on-failure` вместо `unless-stopped`
- Это предотвращает циклические перезапуски при неудачных попытках запуска

## 🚀 Команды запуска

### **Основной режим (рекомендуемый)**
```bash
# Запуск всех основных сервисов
docker-compose up -d backend frontend telegram-bot

# Проверка статуса
docker-compose ps
```

### **Production режим (с Nginx)**
```bash
# Запуск всех сервисов включая Nginx
docker-compose --profile producton up -d

# Доступ к приложению через Nginx
# http://localhost:8080
```

### **Debug режим (для разработки)**
```bash
# Запуск с фронтенд debug контейнером
docker-compose --profile debug up -d
```

## 📂 Доступ к сервисам

| Сервис | URL | Описание |
|--------|-----|----------|
| Frontend (прямой) | http://localhost:3000 | Прямой доступ к React приложению |
| Backend API | http://localhost:5001 | Flask API |
| Backend Health | http://localhost:5001/health | Health check endpoint |
| Nginx Proxy | http://localhost:8080 | Единая точка входа (production) |

## 🔍 Мониторинг и отладка

### **Просмотр логов**
```bash
# Все сервисы
docker-compose logs -f

# Конкретный сервис
docker-compose logs -f telegram-bot
docker-compose logs -f backend
docker-compose logs -f frontend
```

### **Проверка статуса**
```bash
# Статус контейнеров
docker-compose ps

# Детальная информация
docker-compose top
```

### **Перезапуск сервисов**
```bash
# Перезапуск определенного сервиса
docker-compose restart telegram-bot

# Пересборка и перезапуск
docker-compose up -d --build telegram-bot
```

## ⚠️ Важные замечания

1. **Конфигурация Telegram**: Убедитесь, что токен бота правильно настроен в `configs/telegram_config.json`

2. **Health Checks**: Сервисы будут перезапускаться автоматически при неудачных health checks

3. **Локальные данные**: Все данные сохраняются в `./backend/data` и монтируются в контейнеры

4. **Сеть**: Все сервисы работают в единой Docker сети `gigawin-network`

## 🐛 Решение проблем

### **Telegram Bot не запускается**
```bash
# Проверьте логи
docker-compose logs telegram-bot

# Проверьте конфигурацию
cat configs/telegram_config.json
```

### **Backend недоступен**
```bash
# Проверьте health check
curl http://localhost:5001/health

# Проверьте логи
docker-compose logs backend
```

### **Frontend не загружается**
```bash
# Проверьте логи сборки
docker-compose logs frontend

# Попробуйте пересобрать
docker-compose up -d --build frontend
```

## 🔄 Полная перезагрузка

```bash
# Остановить все контейнеры
docker-compose down

# Удалить все образы и пересобрать
docker-compose down --rmi all
docker-compose up -d --build

# Проверить статус
docker-compose ps
```
