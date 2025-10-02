# GigaWin 2025 - Полностью готово для Portainer с HTTPS

## 🎯 Структура проекта (ОБНОВЛЕНО ДЛЯ HTTPS):

- **Backend API**: HTTPS доступ на порту 5001 с самоподписанным SSL сертификатом
- **Frontend**: Использует внешний VPN фронтенд на `10.8.0.17:3017` с HTTPS API  
- **Telegram Bot**: Работает с HTTPS backend
- **Все коммуникации шифруются**

## 📦 Подготовка для Portainer:

### ✅ Готовые tar файлы:
- `gigawin2025-backend.tar` (1.0 GB) - HTTPS backend с SSL
- `gigawin2025-frontend.tar` (148 MB) - фронтенд  
- `gigawin2025-telegram-bot.tar` (1.2 GB) - телеграм бот

## 🚀 Развертывание в Portainer:

### 1. Загрузите образы:
1. Откройте Portainer Registry
2. Загрузите `gigawin2025-backend.tar` (image будет: `gigawin2025-backend:latest`)
3. Загрузите `gigawin2025-frontend.tar` (image будет: `gigawin2025-frontend:latest`)  
4. Загрузите `gigawin2025-telegram-bot.tar` (image будет: `gigawin2025-telegram-bot:latest`)

### 2. Создайте новый Stack:
1. Скопируйте содержимое `docker-compose.yaml`
2. Вставьте в редактор Stack в Portainer
3. Установите название: `gigawin2025`

### 3. Настройки домена:
- Backend будет доступен на HTTPS: `https://your-server:5001`
- Убедитесь что домен `gigawin.unicorns-group.ru` указывает на ваш сервер
- Frontend на VPN автоматически определит правильный HTTPS API URL

## 🌐 Доступ к сервису (ПОЛНЫЙ HTTPS):

### VPN Frontend (рекомендуется):
- **URL**: https://10.8.0.17:3017 (HTTPS фронтенд)
- **API**: Автоматически обращается к `https://gigawin.unicorns-group.ru:5001` (HTTPS)

### Локальный Frontend:
- **URL**: https://localhost:3017 (локальный HTTPS фронтенд через nginx)  
- **API**: Автоматически обращается к `/api` через nginx → backend HTTPS
- **📖 Подробные инструкции**: См. [LOCAL_DEPLOYMENT.md](LOCAL_DEPLOYMENT.md)

### Backend API (прямой доступ):
- **HTTPS URL**: https://gigawin.unicorns-group.ru:5001
- **Health check**: https://gigawin.unicorns-group.ru:5001/health

## 📊 Структура запросов (HTTPS):

### Сценарий 1: VPN Frontend (ПОЛНЫЙ HTTPS)
```
Пользователь → HTTPS VPN Frontend (https://10.8.0.17:3017)
                ↓ HTTPS API запросы
           HTTPS Backend API (https://gigawin.unicorns-group.ru:5001)
                ↓ обработка
              База данных + ML модели
```

### Сценарий 2: Локальный Frontend (HTTPS)
```
Разработчик → HTTPS Localhost (https://localhost:3017)
                ↓ HTTPS через Nginx
              HTTPS Backend API (через Docker сеть)
                ↓ обработка
              База данных + ML модели
```

## 🔧 Проверка работы после развертывания:

```bash
# Проверка HTTPS API
curl -k https://gigawin.unicorns-group.ru:5001/health

# Проверка CORS для HTTPS
curl -k -H "Origin: https://10.8.0.17:3017" https://gigawin.unicorns-group.ru:5001/health

# Проверка главной страницы HTTPS
curl -k https://gigawin.unicorns-group.ru:3017
```

## 📁 Структура файлов:

- `docker-compose.yaml` - конфигурация для Portainer (ОБНОВЛЕНА ДЛЯ HTTPS)
- `backend/Dockerfile.ssl` - HTTPS backend с SSL сертификатом
- `frontend/` - React приложение
- `backend/` - Flask API с HTTPS поддержкой
- tar файлы готовы к импорту в Portainer

## ✨ ИМЕНА ОБРАЗОВ ДЛЯ PORTAINER:

При импорте в Portainer используйте следующие имена:
- **gigawin2025-backend:latest**
- **gigawin2025-frontend:latest**  
- **gigawin2025-telegram-bot:latest**

**Все готово для безопасного HTTPS развертывания в Portainer!** 🚀🔒

---

## 📚 Документация

### 🚀 Быстрый старт
- **[START_HERE.md](START_HERE.md)** ⭐ - НАЧНИТЕ С ЭТОГО! Запуск за 3 шага
- **[QUICKSTART.md](QUICKSTART.md)** - Быстрый запуск за 2 минуты
- **[РЕШЕНИЕ_ПРОБЛЕМЫ_HTTPS.md](РЕШЕНИЕ_ПРОБЛЕМЫ_HTTPS.md)** - Как настроен HTTPS для localhost

### 📖 Инструкции
- **[LOCAL_DEPLOYMENT.md](LOCAL_DEPLOYMENT.md)** - Полная инструкция по локальному запуску с HTTPS
- **[HTTPS_SETUP.md](HTTPS_SETUP.md)** - Детальная информация о HTTPS конфигурации
- **[TROUBLESHOOTING.md](TROUBLESHOOTING.md)** - Решение проблем и отладка

### 🏢 Production
- **[DEPLOYMENT.md](DEPLOYMENT.md)** - Развертывание в production
- **[PORTAINER_DEPLOY.md](PORTAINER_DEPLOY.md)** - Развертывание через Portainer

### 📚 Навигация
- **[DOCS_INDEX.md](DOCS_INDEX.md)** - Полный индекс документации